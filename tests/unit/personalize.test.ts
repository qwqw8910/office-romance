import { describe, expect, it } from 'vitest'
import { day1 } from '../../src/content/day1'
import { personalize, sanitizeName } from '../../src/game/personalize'

describe('personalize', () => {
  it('replaces the heroine name everywhere in the script', () => {
    const out = JSON.stringify(personalize(day1, '小美'))
    expect(out).not.toContain('晏晴')
    expect(out).toContain('小美姐')
  })

  it('leaves the script untouched for the default name', () => {
    expect(personalize(day1, '晏晴')).toBe(day1)
  })

  it('sanitizes input', () => {
    expect(sanitizeName('   ')).toBe('晏晴')
    expect(sanitizeName(' 小 美 <b>')).toBe('小美b')
    expect(sanitizeName('一二三四五六')).toBe('一二三四')
  })
})
