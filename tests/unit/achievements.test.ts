import { describe, expect, it } from 'vitest'
import { createState } from '../../src/game/director'
import { ACHIEVEMENTS_KEY, evaluate, readAchievements, unlock } from '../../src/game/achievements'
import type { KeyValueStore } from '../../src/game/save'

function memory(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('evaluate', () => {
  it('maps each ending to its achievement', () => {
    const s = createState()
    s.ending = { kind: 'safe', lead: 'shen' }
    expect(evaluate(s)).toContain('ending-shen')
    s.ending = { kind: 'pair' }
    expect(evaluate(s)).toContain('ending-pair')
    s.ending = { kind: 'alone' }
    expect(evaluate(s)).toContain('ending-alone')
    s.ending = null
    expect(evaluate(s)).toEqual([])
  })

  it('perfect cover needs every boss event to succeed', () => {
    const s = createState()
    s.ending = { kind: 'safe', lead: 'zhou' }
    s.bossLog = [
      { slotId: 'desk', outcome: 'success' },
      { slotId: 'pantry', outcome: 'success' },
    ]
    expect(evaluate(s)).toContain('perfect-cover')
    s.bossLog.push({ slotId: 'copyroom', outcome: 'caught', rescued: true })
    expect(evaluate(s)).not.toContain('perfect-cover')
    expect(evaluate(s)).toContain('rescued')
  })
})

describe('unlock', () => {
  it('reports only first-time unlocks and persists the union', () => {
    const store = memory()
    expect(unlock(store, ['ending-zhou']).fresh).toEqual(['ending-zhou'])
    const again = unlock(store, ['ending-zhou', 'rescued'])
    expect(again.fresh).toEqual(['rescued'])
    expect(readAchievements(store)).toEqual(['ending-zhou', 'rescued'])
  })

  it('ignores corrupt or unknown data', () => {
    const store = memory()
    store.data.set(ACHIEVEMENTS_KEY, '{oops')
    expect(readAchievements(store)).toEqual([])
    store.data.set(ACHIEVEMENTS_KEY, JSON.stringify(['ending-zhou', 'nope']))
    expect(readAchievements(store)).toEqual(['ending-zhou'])
    expect(readAchievements(null)).toEqual([])
  })
})
