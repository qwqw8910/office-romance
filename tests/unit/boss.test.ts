import { describe, expect, it } from 'vitest'
import {
  buildTimeline,
  canSee,
  coverIntervals,
  coverStateAt,
  judge,
  poseAt,
  type BossTimeline,
  type CoverPress,
} from '../../src/game/boss'
import { createRng } from '../../src/game/rng'
import type { BossPattern } from '../../src/game/types'

const patterns: BossPattern[] = ['patrol', 'ambush', 'fakeout', 'combo']
const tl = (p: BossPattern, seed = 1, leniency = 1) =>
  buildTimeline(p, createRng(seed), { leniency })

/** 在每段曝光開始前 0.3 秒按一次：理論上的完美玩法 */
const perfect = (timeline: BossTimeline, cover: CoverPress['cover']): CoverPress[] =>
  timeline.exposures.map(([s]) => ({ t: s - 0.3, cover }))

describe('timelines', () => {
  it.each(patterns)('%s fits the event budget and has exposures', (p) => {
    const t = tl(p)
    expect(t.duration).toBeGreaterThan(3)
    expect(t.duration).toBeLessThan(10)
    expect(t.exposures.length).toBeGreaterThan(0)
  })

  it('patrol, ambush, fakeout expose once; combo exposes twice', () => {
    expect(tl('patrol').exposures).toHaveLength(1)
    expect(tl('ambush').exposures).toHaveLength(1)
    expect(tl('fakeout').exposures).toHaveLength(1)
    expect(tl('combo').exposures).toHaveLength(2)
  })

  it('ambush has a tell cue well before the dash reaches her', () => {
    const t = tl('ambush')
    expect(t.cues).toHaveLength(1)
    expect(t.exposures[0]![0] - t.cues[0]!.t).toBeGreaterThan(0.8)
  })

  it('fakeout stops out of sight first, then returns', () => {
    const t = tl('fakeout')
    expect(t.speech.map((s) => s.text)).toEqual(['嗯？沒人嘛。', '騙你的啦！'])
    expect(canSee(t, t.speech[0]!.t)).toBe(false)
    expect(t.exposures[0]![0]).toBeGreaterThan(t.speech[1]!.t)
  })

  it('fakeout pause is seeded and deterministic', () => {
    expect(tl('fakeout', 7).duration).toBe(tl('fakeout', 7).duration)
    expect(tl('fakeout', 7).duration).not.toBe(tl('fakeout', 8).duration)
  })

  it('poseAt interpolates and clamps', () => {
    const t = tl('patrol')
    expect(poseAt(t, -1).x).toBe(t.keyframes[0]!.x)
    expect(poseAt(t, 999).x).toBe(t.keyframes[t.keyframes.length - 1]!.x)
    expect(poseAt(t, t.duration / 2).x).toBeGreaterThan(t.keyframes[0]!.x)
  })

  it('reduced-motion leniency lengthens cover duration by 20%', () => {
    expect(tl('patrol', 1, 1.2).coverDuration).toBeCloseTo(tl('patrol').coverDuration * 1.2)
  })
})

describe('coverIntervals', () => {
  it('ignores presses during cover or cooldown', () => {
    const iv = coverIntervals(
      [
        { t: 1, cover: 'phone' },
        { t: 2, cover: 'copy' }, // 掩護中
        { t: 3.5, cover: 'copy' }, // 冷卻中（3–4）
        { t: 4, cover: 'pen' },
      ],
      2,
      1,
    )
    expect(iv).toEqual([
      { start: 1, end: 3, cover: 'phone' },
      { start: 4, end: 6, cover: 'pen' },
    ])
  })

  it('reports covering / cooldown / idle', () => {
    const t = tl('patrol')
    const presses: CoverPress[] = [{ t: 1, cover: 'phone' }]
    expect(coverStateAt(t, presses, 0.5).state).toBe('idle')
    expect(coverStateAt(t, presses, 2).state).toBe('covering')
    expect(coverStateAt(t, presses, 3.5).state).toBe('cooldown')
    expect(coverStateAt(t, presses, 4.1).state).toBe('idle')
  })
})

describe('judge', () => {
  it.each(patterns)('%s: perfect timing with the right cover succeeds', (p) => {
    const t = tl(p)
    expect(judge(t, perfect(t, 'phone'), 'phone')).toBe('success')
  })

  it.each(patterns)('%s: right timing with the wrong cover is awkward', (p) => {
    const t = tl(p)
    expect(judge(t, perfect(t, 'copy'), 'phone')).toBe('awkward')
  })

  it.each(patterns)('%s: no cover is caught', (p) => {
    expect(judge(tl(p), [], 'phone')).toBe('caught')
  })

  it('pressing too early lets cover expire before the boss sees you', () => {
    const t = tl('patrol')
    const [s] = t.exposures[0]!
    expect(judge(t, [{ t: s - t.coverDuration - 0.1, cover: 'phone' }], 'phone')).toBe('caught')
  })

  it('pressing after the exposure starts is caught', () => {
    const t = tl('ambush')
    const [s] = t.exposures[0]!
    expect(judge(t, [{ t: s + 0.05, cover: 'phone' }], 'phone')).toBe('caught')
  })

  it('fakeout punishes covering on the first approach', () => {
    const t = tl('fakeout')
    const presses: CoverPress[] = [
      { t: t.speech[0]!.t - 0.3, cover: 'copy' },
      { t: t.exposures[0]![0] - 0.05, cover: 'copy' }, // 仍在冷卻中
    ]
    expect(judge(t, presses, 'copy')).toBe('caught')
  })

  it('returns pending mid-event and caught as soon as an exposure is uncovered', () => {
    const t = tl('patrol')
    const [s, e] = t.exposures[0]!
    expect(judge(t, [], 'phone', s - 0.1)).toBe('pending')
    expect(judge(t, [], 'phone', s + 0.01)).toBe('caught')
    expect(judge(t, perfect(t, 'phone'), 'phone', e + 0.01)).toBe('pending')
  })

  it('combo needs both exposures covered', () => {
    const t = tl('combo')
    const first: CoverPress[] = [{ t: t.exposures[0]![0] - 0.3, cover: 'pen' }]
    expect(judge(t, first, 'pen')).toBe('caught')
    expect(judge(t, perfect(t, 'pen'), 'pen')).toBe('success')
  })
})
