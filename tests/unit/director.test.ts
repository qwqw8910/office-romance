import { describe, expect, it } from 'vitest'
import {
  choose,
  createState,
  jumpToSlot,
  next,
  resolveBoss,
  startGame,
  type GameState,
} from '../../src/game/director'
import { validateScript } from '../../src/game/validate'
import { tuning } from '../../src/game/tuning'
import { day1 } from '../../src/content/day1'
import type { Beat, BossOutcome, Script } from '../../src/game/types'

interface PlayOptions {
  pick?: (s: GameState) => number
  outcomes?: BossOutcome[]
}

/** 自動玩完：台詞直接推進，選項用 pick 決定，主管事件依序套用 outcomes（不足時視為成功） */
function play(script: Script, { pick = () => 0, outcomes = [] }: PlayOptions = {}): GameState {
  const s = createState()
  startGame(s, script)
  const queue = [...outcomes]
  for (let guard = 0; guard < 500 && s.phase !== 'ending'; guard++) {
    if (s.phase === 'line' || s.phase === 'slotIntro') next(s, script)
    else if (s.phase === 'choice') choose(s, script, pick(s))
    else if (s.phase === 'boss') resolveBoss(s, script, queue.shift() ?? 'success')
  }
  return s
}

describe('day1 script', () => {
  it('passes validation', () => {
    expect(validateScript(day1)).toEqual([])
  })

  it('has 5 slots and uses every boss pattern', () => {
    expect(day1.slots).toHaveLength(5)
    const patterns = new Set<string>()
    const walk = (beats: Beat[]) =>
      beats.forEach((b) => {
        if (b.kind === 'boss') patterns.add(b.pattern)
      })
    for (const slot of day1.slots) {
      if (Array.isArray(slot.beats)) walk(slot.beats)
      else Object.values(slot.beats.byLead).forEach(walk)
    }
    expect(patterns).toEqual(new Set(['patrol', 'ambush', 'fakeout', 'combo']))
  })
})

describe('director', () => {
  it('plays a whole day to the safe ending', () => {
    const s = play(day1)
    expect(s.phase).toBe('ending')
    expect(s.ending?.kind).toBe('safe')
    expect(s.slotIndex).toBe(4)
    expect(s.bossLog).toHaveLength(4)
  })

  it('stops at slotIntro before the first slot', () => {
    const s = createState()
    startGame(s, day1)
    while (s.phase === 'line') next(s, day1)
    expect(s.phase).toBe('slotIntro')
    expect(s.slotIndex).toBe(0)
  })

  it('three catches lead to the caught ending immediately', () => {
    const s = play(day1, { outcomes: ['caught', 'caught', 'caught'] })
    expect(s.ending).toEqual({ kind: 'caught' })
    expect(s.suspicion).toBe(3)
    expect(day1.slots[s.slotIndex]!.id).toBe('copyroom')
  })

  it('two catches still reach the safe ending', () => {
    const s = play(day1, { outcomes: ['caught', 'success', 'caught', 'success'] })
    expect(s.ending?.kind).toBe('safe')
    expect(s.suspicion).toBe(2)
  })

  it('success adds +5 and awkward −5 to the event lead', () => {
    const all = (o: BossOutcome) => [o, o, o, o]
    const ok = play(day1, { pick: () => 1, outcomes: all('success') })
    const bad = play(day1, { pick: () => 1, outcomes: all('awkward') })
    expect(ok.affection.zhou).toBeGreaterThan(bad.affection.zhou)
    expect(ok.affection.shen).toBeGreaterThan(bad.affection.shen)
  })

  it('routes slot 5 and the ending to the leading lead', () => {
    // 冷落周以澄、親近沈硯、午休選沈硯
    const pick = (st: GameState) => {
      const id = day1.slots[st.slotIndex]?.id
      if (id === 'desk') return 1
      if (id === 'rooftop') return 1
      if (id === 'copyroom') return 1
      return 0
    }
    const s = play(day1, { pick })
    expect(s.affection.shen).toBeGreaterThan(s.affection.zhou)
    expect(s.ending).toEqual({ kind: 'safe', lead: 'shen' })
    expect(s.flags.lunch).toBe('shen')
  })

  it('a tie goes to the lunch partner', () => {
    const s = createState()
    s.affection = { zhou: 50, shen: 50 }
    s.flags.lunch = 'shen'
    s.slotIndex = day1.slots.length - 1
    s.phase = 'line'
    next(s, day1)
    expect(s.ending).toEqual({ kind: 'safe', lead: 'shen' })
  })

  it('choose and resolveBoss ignore calls in the wrong phase', () => {
    const s = createState()
    startGame(s, day1)
    const before = JSON.stringify(s)
    choose(s, day1, 0)
    resolveBoss(s, day1, 'caught')
    expect(JSON.stringify(s)).toBe(before)
  })

  it('jumpToSlot starts at the given slot', () => {
    const s = createState()
    jumpToSlot(s, day1, 4)
    expect(s.phase).toBe('slotIntro')
    expect(day1.slots[s.slotIndex]!.id).toBe('copyroom')
  })
})

/**
 * 依時段挑選項。值可以是數字（該時段每個選擇都選這個）或陣列（依序對應該時段的第 n 個選擇）；
 * 未列出的時段選第 1 個。
 */
function byslot(picks: Record<string, number | number[]>) {
  const seen: Record<string, number> = {}
  return (st: GameState): number => {
    const id = day1.slots[st.slotIndex]?.id ?? ''
    const n = (seen[id] = (seen[id] ?? -1) + 1)
    const p = picks[id] ?? 0
    return Array.isArray(p) ? (p[n] ?? 0) : p
  }
}

describe('risk (heat)', () => {
  it('bold options add heat, and the next boss event resets it', () => {
    const s = createState()
    startGame(s, day1)
    const phase = () => s.phase
    while (phase() !== 'choice') next(s, day1)
    choose(s, day1, 0) // 「你是不是根本沒壞？」大膽
    expect(s.heat).toBe(1)
    while (phase() !== 'boss') next(s, day1)
    resolveBoss(s, day1, 'success')
    expect(s.heat).toBe(0)
  })
})

describe('rescue', () => {
  it('a lead with high affection rescues one catch per day', () => {
    const s = createState()
    startGame(s, day1)
    while (s.phase !== 'boss') {
      if (s.phase === 'choice') choose(s, day1, 0)
      else next(s, day1)
    }
    s.affection.zhou = tuning.rescueAt
    resolveBoss(s, day1, 'caught')
    expect(s.suspicion).toBe(0)
    expect(s.flags.rescued).toBe('zhou')
    expect(s.bossLog.at(-1)).toMatchObject({ outcome: 'caught', rescued: true })
    expect(s.current).toEqual(day1.rescue.zhou[0])
  })

  it('does not rescue twice', () => {
    // 一路選第 1 個：到影印室時周以澄好感已經超過救場門檻
    const s = play(day1, { outcomes: ['success', 'success', 'caught', 'caught'] })
    expect(s.bossLog.filter((b) => b.rescued)).toHaveLength(1)
    expect(s.suspicion).toBe(1)
  })
})

describe('endings', () => {
  it('both leads below readAt ends alone', () => {
    const s = play(day1, {
      pick: byslot({ desk: 1, pantry: [1, 2], copyroom: 1 }),
      outcomes: ['awkward', 'awkward', 'awkward', 'awkward'],
    })
    expect(Math.max(s.affection.zhou, s.affection.shen)).toBeLessThan(tuning.affection.readAt)
    expect(s.ending).toEqual({ kind: 'alone' })
  })

  it('matchmaking in the pantry and at lunch unlocks the hidden pair route', () => {
    const s = play(day1, {
      pick: byslot({ desk: 1, pantry: [1, 1], rooftop: [2, 0], copyroom: 1 }),
    })
    expect(s.flags.matchmake).toBe('pantry')
    expect(s.flags.lunch).toBe('both')
    expect(s.flags.route).toBe('pair')
    expect(s.ending).toEqual({ kind: 'pair' })
  })

  it('the pair route needs both matchmaking choices', () => {
    const lunchOnly = play(day1, { pick: byslot({ desk: 1, pantry: [1, 0], rooftop: [2, 0] }) })
    expect(lunchOnly.flags.matchmake).toBeUndefined()
    expect(lunchOnly.ending?.kind).not.toBe('pair')
    const pantryOnly = play(day1, { pick: byslot({ desk: 1, pantry: [1, 1], rooftop: [1, 0] }) })
    expect(pantryOnly.ending?.kind).not.toBe('pair')
  })

  it('getting too close to either lead closes the pair route', () => {
    const s = createState()
    s.flags = { matchmake: 'pantry', lunch: 'both' }
    s.affection = { zhou: tuning.affection.typingAt, shen: 20 }
    s.slotIndex = day1.slots.length - 2
    s.phase = 'line'
    next(s, day1)
    expect(s.flags.route).toBeUndefined()
  })
})
