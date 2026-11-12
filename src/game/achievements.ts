import type { GameState } from './director'
import type { KeyValueStore } from './save'
import type { CgId } from '../content/expressions'

/**
 * 成就：跟存檔分開存，重新開始也不會消失。
 * 每次走到結局時用 evaluate() 算出這一輪達成的成就，再跟已解鎖的合併。
 */
export const ACHIEVEMENTS_KEY = 'office-romance:achievements'

export type AchievementId =
  | 'ending-zhou'
  | 'ending-shen'
  | 'ending-alone'
  | 'ending-caught'
  | 'ending-pair'
  | 'perfect-cover'
  | 'rescued'

export interface Achievement {
  id: AchievementId
  title: string
  /** 解鎖後顯示的說明 */
  description: string
  /** 隱藏成就：解鎖前標題與說明都顯示為「？？？」 */
  hidden?: boolean
  /** 解鎖後可以回想的結局 CG */
  cg?: CgId
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'ending-zhou',
    title: '準時下班',
    description: '周以澄按住了電梯門。',
    cg: 'zhou-safe',
  },
  {
    id: 'ending-shen',
    title: '不說出口的溫柔',
    description: '沈硯把圍巾遞了過來。',
    cg: 'shen-safe',
  },
  { id: 'ending-alone', title: '一個人的電梯', description: '今天跟誰都沒說上幾句話。' },
  { id: 'ending-caught', title: '這個很簡單吧？', description: '被經理約談了三次。' },
  {
    id: 'ending-pair',
    title: '我們是一家人嘛',
    description: '幫他們牽了線，自己等下一班電梯。',
    hidden: true,
    cg: 'pair',
  },
  { id: 'perfect-cover', title: '完美掩護', description: '一天內每次主管路過都完美掩護。' },
  { id: 'rescued', title: '有人罩', description: '被抓的時候，有人出來救場。' },
]

/** 這一輪（已走到結局的狀態）達成的成就 */
export function evaluate(state: GameState): AchievementId[] {
  const out: AchievementId[] = []
  const ending = state.ending
  if (!ending) return out
  if (ending.kind === 'safe') out.push(ending.lead === 'zhou' ? 'ending-zhou' : 'ending-shen')
  else if (ending.kind === 'alone') out.push('ending-alone')
  else if (ending.kind === 'caught') out.push('ending-caught')
  else out.push('ending-pair')
  if (
    ending.kind !== 'caught' &&
    state.bossLog.length > 0 &&
    state.bossLog.every((b) => b.outcome === 'success')
  )
    out.push('perfect-cover')
  if (state.bossLog.some((b) => b.rescued)) out.push('rescued')
  return out
}

const VALID = new Set<string>(ACHIEVEMENTS.map((a) => a.id))

export function readAchievements(store: KeyValueStore | null): AchievementId[] {
  try {
    const raw = store?.getItem(ACHIEVEMENTS_KEY)
    const data: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? (data.filter((id) => VALID.has(id)) as AchievementId[]) : []
  } catch {
    return []
  }
}

/** 合併新達成的成就並寫回；回傳這次才第一次解鎖的成就 */
export function unlock(
  store: KeyValueStore | null,
  earned: readonly AchievementId[],
): { all: AchievementId[]; fresh: AchievementId[] } {
  const all = readAchievements(store)
  const fresh = earned.filter((id) => !all.includes(id))
  const merged = [...all, ...fresh]
  try {
    if (fresh.length) store?.setItem(ACHIEVEMENTS_KEY, JSON.stringify(merged))
  } catch {
    // 寫不進去就只在這次顯示
  }
  return { all: merged, fresh }
}
