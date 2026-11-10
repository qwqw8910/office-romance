import { describe, expect, it } from 'vitest'
import {
  affectionStatus,
  applyEffects,
  clampAffection,
  initialAffection,
  leadingLead,
} from '../../src/game/affection'
import { addSuspicion, isBusted } from '../../src/game/suspicion'

describe('affection', () => {
  it('starts at 20 for both leads', () => {
    expect(initialAffection()).toEqual({ zhou: 20, shen: 20 })
  })

  it('clamps to 0–100', () => {
    expect(clampAffection(-5)).toBe(0)
    expect(clampAffection(130)).toBe(100)
    const a = { zhou: 95, shen: 3 }
    applyEffects(a, [
      { lead: 'zhou', delta: 15 },
      { lead: 'shen', delta: -10 },
    ])
    expect(a).toEqual({ zhou: 100, shen: 0 })
  })

  it('maps thresholds to message status', () => {
    expect(affectionStatus(39)).toBe('unread')
    expect(affectionStatus(40)).toBe('read')
    expect(affectionStatus(69)).toBe('read')
    expect(affectionStatus(70)).toBe('typing')
  })

  it('picks the leading lead, tiebreak on equal', () => {
    expect(leadingLead({ zhou: 50, shen: 40 })).toBe('zhou')
    expect(leadingLead({ zhou: 40, shen: 50 })).toBe('shen')
    expect(leadingLead({ zhou: 40, shen: 40 }, 'shen')).toBe('shen')
    expect(leadingLead({ zhou: 40, shen: 40 })).toBe('zhou')
  })
})

describe('suspicion', () => {
  it('caps at 3 and busts at 3', () => {
    expect(addSuspicion(0)).toBe(1)
    expect(addSuspicion(3)).toBe(3)
    expect(isBusted(2)).toBe(false)
    expect(isBusted(3)).toBe(true)
  })
})
