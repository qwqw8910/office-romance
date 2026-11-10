import { describe, expect, it } from 'vitest'
import { expressionFor, heartbeatFor } from '../../src/content/expressions'
import { day1 } from '../../src/content/day1'

describe('heartbeatFor', () => {
  it('fires only for blush moods', () => {
    expect(heartbeatFor('臉紅')).toBe('soft')
    expect(heartbeatFor('別過頭')).toBe('soft')
    expect(heartbeatFor('笑')).toBeNull()
    expect(heartbeatFor('立正')).toBeNull()
    expect(heartbeatFor(undefined)).toBeNull()
  })

  it('makes the biggest moments strong', () => {
    expect(heartbeatFor('爆紅')).toBe('strong')
    expect(heartbeatFor('不敢動')).toBe('strong')
  })

  it('agrees with the sprite expression', () => {
    for (const mood of ['臉紅', '爆紅', '偷笑', '不敢動', '別過頭', '緊張', '尷尬', '垂頭']) {
      expect(expressionFor(mood)).toBe('blush')
      expect(heartbeatFor(mood)).not.toBeNull()
    }
  })

  it('has at least one heartbeat moment for each lead in the script', () => {
    const text = JSON.stringify(day1)
    for (const lead of ['zhou', 'shen']) {
      const re = new RegExp(
        `"speaker":"${lead}"[^}]*"mood":"(臉紅|爆紅|偷笑|不敢動|別過頭|緊張|尷尬|垂頭)"`,
      )
      expect(text).toMatch(re)
    }
  })
})
