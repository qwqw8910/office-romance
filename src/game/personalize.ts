import type { Script } from './types'

export const DEFAULT_PLAYER_NAME = '晏晴'
export const MAX_NAME_LENGTH = 4

/** 劇本裡女主的全名與同事平常叫她的名字 */
const FULL_NAME = '林晏晴'
const CALL_NAME = DEFAULT_PLAYER_NAME

/** 去掉空白與控制字元、限制長度；空字串回到預設名字 */
export function sanitizeName(raw: string): string {
  const cleaned = Array.from(raw)
    .filter((ch) => ch.charCodeAt(0) > 0x1f && !/[\s<>]/.test(ch))
    .slice(0, MAX_NAME_LENGTH)
    .join('')
  return cleaned || DEFAULT_PLAYER_NAME
}

/** 把劇本中的女主名字換成玩家輸入的名字（回傳新物件，不改動原劇本） */
export function personalize(script: Script, name: string): Script {
  const clean = sanitizeName(name)
  if (clean === CALL_NAME) return script
  const swap = (v: unknown): unknown => {
    if (typeof v === 'string')
      return v.split(FULL_NAME).join(`林${clean}`).split(CALL_NAME).join(clean)
    if (Array.isArray(v)) return v.map(swap)
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, swap(val)]))
    }
    return v
  }
  return swap(script) as Script
}
