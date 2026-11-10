import type { BossOutcome, BossPattern, CoverId } from './types'
import { tuning } from './tuning'
import { range, type Rng } from './rng'

/**
 * 「預判主管」小遊戲的純邏輯。
 *
 * 走道是一條水平線，女主固定在 heroineX。主管沿著關鍵影格移動，
 * 面向女主且距離在 sightRange 之內時，就是「曝光區間」。
 * 玩家每次按掩護會得到一段 coverDuration 的掩護，之後冷卻 coverCooldown。
 * 每段曝光區間都必須被同一段掩護完整蓋住，否則被抓。
 */

export type Facing = 1 | -1

export interface Keyframe {
  t: number
  x: number
  /** 從這個影格開始，到下一個影格之前的朝向 */
  facing: Facing
}

export interface TimedText {
  t: number
  text: string
}

export interface BossTimeline {
  pattern: BossPattern
  keyframes: Keyframe[]
  /** 預兆文字，例如腳步聲 */
  cues: TimedText[]
  /** 主管自言自語 */
  speech: TimedText[]
  exposures: Array<[start: number, end: number]>
  duration: number
  heroineX: number
  sightRange: number
  coverDuration: number
  coverCooldown: number
}

export interface TimelineOptions {
  /** 減少動態效果：掩護時間與預兆放寬 */
  leniency?: number
}

class Builder {
  t = 0
  x: number
  facing: Facing = 1
  keyframes: Keyframe[] = []
  cues: TimedText[] = []
  speech: TimedText[] = []

  constructor(x: number) {
    this.x = x
    this.mark()
  }

  private mark() {
    const last = this.keyframes[this.keyframes.length - 1]
    if (last && last.t === this.t) {
      last.x = this.x
      last.facing = this.facing
    } else {
      this.keyframes.push({ t: this.t, x: this.x, facing: this.facing })
    }
  }

  wait(seconds: number) {
    this.t += seconds
    this.mark()
    return this
  }

  walk(toX: number, speed: number) {
    this.facing = toX >= this.x ? 1 : -1
    this.mark()
    this.t += Math.abs(toX - this.x) / speed
    this.x = toX
    this.mark()
    return this
  }

  face(dir: Facing) {
    this.facing = dir
    this.mark()
    return this
  }

  cue(text: string) {
    this.cues.push({ t: this.t, text })
    return this
  }

  say(text: string) {
    this.speech.push({ t: this.t, text })
    return this
  }
}

/** 回馬槍：朝 dir 方向走向女主，停在視線外，假裝離開，停頓後衝回來，經過她之後停下 */
function fakeout(b: Builder, dir: Facing, rng: Rng) {
  const { heroineX: hx, sightRange: r } = tuning.boss
  const stopX = hx - dir * (r + 50)
  const backX = stopX - dir * 150
  b.walk(stopX, tuning.boss.fakeoutSpeed)
    .wait(0.35)
    .say('嗯？沒人嘛。')
    .walk(backX, tuning.boss.fakeoutSpeed)
    .wait(range(rng, tuning.boss.fakeoutPauseMin, tuning.boss.fakeoutPauseMax))
    .face(dir)
    .say('騙你的啦！')
    .wait(0.15)
    .walk(hx + dir * 300, tuning.boss.fakeoutReturnSpeed)
}

export function buildTimeline(
  pattern: BossPattern,
  rng: Rng,
  options: TimelineOptions = {},
): BossTimeline {
  const leniency = options.leniency ?? 1
  const c = tuning.boss
  const b = new Builder(c.corridorStart)
  b.wait(c.leadIn)

  switch (pattern) {
    case 'patrol':
      b.walk(c.corridorEnd, c.patrolSpeed)
      break
    case 'ambush':
      b.cue('啪嗒、啪嗒……一股茶葉蛋味飄來。')
        .wait(c.ambushTell * leniency)
        .walk(c.corridorEnd, c.ambushSpeed)
      break
    case 'fakeout':
      fakeout(b, 1, rng)
      break
    case 'combo':
      b.cue('啪嗒、啪嗒……一股茶葉蛋味飄來。')
        .wait(c.ambushTell * leniency)
        .walk(c.corridorEnd, c.ambushSpeed)
        .say('我的茶葉蛋呢……')
        .wait(0.3)
      fakeout(b, -1, rng)
      break
  }
  b.wait(c.tail)

  const timeline: BossTimeline = {
    pattern,
    keyframes: b.keyframes,
    cues: b.cues,
    speech: b.speech,
    exposures: [],
    duration: b.t,
    heroineX: c.heroineX,
    sightRange: c.sightRange,
    coverDuration: c.coverDuration * leniency,
    coverCooldown: c.coverCooldown,
  }
  timeline.exposures = computeExposures(timeline)
  return timeline
}

/** 主管在時間 t 的位置與朝向 */
export function poseAt(timeline: BossTimeline, t: number): { x: number; facing: Facing } {
  const kfs = timeline.keyframes
  const first = kfs[0]!
  if (t <= first.t) return { x: first.x, facing: first.facing }
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]!
    const b = kfs[i + 1]!
    if (t < b.t) {
      const k = (t - a.t) / (b.t - a.t)
      return { x: a.x + (b.x - a.x) * k, facing: a.facing }
    }
  }
  const last = kfs[kfs.length - 1]!
  return { x: last.x, facing: last.facing }
}

export function canSee(timeline: BossTimeline, t: number): boolean {
  const { x, facing } = poseAt(timeline, t)
  const ahead = (timeline.heroineX - x) * facing
  return ahead >= 0 && ahead <= timeline.sightRange
}

const STEP = 0.002

function computeExposures(timeline: BossTimeline): Array<[number, number]> {
  const out: Array<[number, number]> = []
  let start: number | null = null
  for (let t = 0; t <= timeline.duration + STEP; t += STEP) {
    const seen = canSee(timeline, t)
    if (seen && start === null) start = t
    if (!seen && start !== null) {
      out.push([round(start), round(t - STEP)])
      start = null
    }
  }
  if (start !== null) out.push([round(start), round(timeline.duration)])
  return out
}

function round(n: number) {
  return Math.round(n * 1000) / 1000
}

export interface CoverPress {
  t: number
  cover: CoverId
}

export interface CoverInterval {
  start: number
  end: number
  cover: CoverId
}

/** 把玩家的按鍵轉成實際生效的掩護區間（冷卻中的按鍵無效） */
export function coverIntervals(
  presses: readonly CoverPress[],
  duration: number,
  cooldown: number,
): CoverInterval[] {
  const sorted = [...presses].sort((a, b) => a.t - b.t)
  const out: CoverInterval[] = []
  let available = -Infinity
  for (const p of sorted) {
    if (p.t < available) continue
    out.push({ start: p.t, end: p.t + duration, cover: p.cover })
    available = p.t + duration + cooldown
  }
  return out
}

/** 某個時間點是否正在掩護、或在冷卻中，給畫面顯示用 */
export function coverStateAt(
  timeline: BossTimeline,
  presses: readonly CoverPress[],
  t: number,
): { state: 'idle' | 'covering' | 'cooldown'; cover?: CoverId; remaining: number } {
  const intervals = coverIntervals(
    presses.filter((p) => p.t <= t),
    timeline.coverDuration,
    timeline.coverCooldown,
  )
  const last = intervals[intervals.length - 1]
  if (!last) return { state: 'idle', remaining: 0 }
  if (t < last.end) return { state: 'covering', cover: last.cover, remaining: last.end - t }
  const cdEnd = last.end + timeline.coverCooldown
  if (t < cdEnd) return { state: 'cooldown', remaining: cdEnd - t }
  return { state: 'idle', remaining: 0 }
}

export type Judgement = BossOutcome | 'pending'

/**
 * 判定。upTo 預設為事件結束；遊戲進行中每一幀傳入目前時間，
 * 一旦出現沒被蓋住的曝光就立刻回傳 caught。
 */
export function judge(
  timeline: BossTimeline,
  presses: readonly CoverPress[],
  sceneCover: CoverId,
  upTo: number = timeline.duration,
): Judgement {
  const intervals = coverIntervals(
    presses.filter((p) => p.t <= upTo),
    timeline.coverDuration,
    timeline.coverCooldown,
  )
  let mismatch = false
  for (const [start, end] of timeline.exposures) {
    if (start > upTo) return 'pending'
    const until = Math.min(end, upTo)
    const hit = intervals.find((iv) => iv.start <= start && iv.end >= until)
    if (!hit) return 'caught'
    if (hit.cover !== sceneCover) mismatch = true
    if (end > upTo) return 'pending'
  }
  if (upTo < timeline.duration) return 'pending'
  return mismatch ? 'awkward' : 'success'
}
