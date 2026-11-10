import type { GameState } from './director'
import type { LeadId, Line, Script } from './types'

/**
 * 存檔：整份 GameState 是純資料，直接序列化進 localStorage。
 * 劇本內容改動後舊存檔的 queue 會對不上，所以存檔帶著劇本指紋，不符就當作沒有存檔。
 */
export const SAVE_KEY = 'office-romance:save'
export const SETTINGS_KEY = 'office-romance:settings'
const SAVE_VERSION = 1

/** 畫面狀態：讀檔後要還原誰站在場上、對話框顯示哪一句 */
export interface Presentation {
  onStage: LeadId | null
  expression: string
  lastLine: Line | null
}

export interface SaveData {
  version: number
  script: string
  savedAt: number
  state: GameState
  view: Presentation
  /** 玩家為女主取的名字；舊存檔沒有這欄 */
  playerName?: string
}

export interface Settings {
  typewriter: boolean
  reducedMotion: boolean
  /** 背景音樂與音效；舊存檔沒有這兩欄，缺少時預設開啟 */
  music?: boolean
  sfx?: boolean
  playerName?: string
}

/** 最小的 Storage 介面，方便測試時注入 */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** FNV-1a，夠用來判斷劇本有沒有改過 */
export function scriptFingerprint(script: Script): string {
  const text = JSON.stringify(script)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** 有些瀏覽器（無痕、封鎖網站資料）存取 localStorage 會丟例外 */
export function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage
    const probe = `${SAVE_KEY}:probe`
    s.setItem(probe, '1')
    s.removeItem(probe)
    return s
  } catch {
    return null
  }
}

function readJson(store: KeyValueStore | null, key: string): unknown {
  if (!store) return null
  try {
    const raw = store.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(store: KeyValueStore | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value))
  } catch {
    // 空間不足或被封鎖時放棄存檔，不影響遊戲
  }
}

/** 標題與結局畫面沒有可續玩的進度 */
export function isSaveable(state: GameState): boolean {
  return state.phase !== 'title' && state.phase !== 'ending'
}

export function writeSave(
  store: KeyValueStore | null,
  script: Script,
  state: GameState,
  view: Presentation,
  playerName?: string,
  now = Date.now(),
): void {
  const data: SaveData = {
    version: SAVE_VERSION,
    script: scriptFingerprint(script),
    savedAt: now,
    state,
    view,
    playerName,
  }
  writeJson(store, SAVE_KEY, data)
}

export function readSave(store: KeyValueStore | null, script: Script): SaveData | null {
  const data = readJson(store, SAVE_KEY) as SaveData | null
  if (
    !data ||
    data.version !== SAVE_VERSION ||
    data.script !== scriptFingerprint(script) ||
    !data.state ||
    !isSaveable(data.state)
  ) {
    return null
  }
  return data
}

export function clearSave(store: KeyValueStore | null): void {
  try {
    store?.removeItem(SAVE_KEY)
  } catch {
    // 忽略
  }
}

export function readSettings(store: KeyValueStore | null): Partial<Settings> {
  const data = readJson(store, SETTINGS_KEY)
  if (!data || typeof data !== 'object') return {}
  const out: Partial<Settings> = {}
  const d = data as Record<string, unknown>
  if (typeof d.typewriter === 'boolean') out.typewriter = d.typewriter
  if (typeof d.reducedMotion === 'boolean') out.reducedMotion = d.reducedMotion
  if (typeof d.music === 'boolean') out.music = d.music
  if (typeof d.sfx === 'boolean') out.sfx = d.sfx
  if (typeof d.playerName === 'string') out.playerName = d.playerName
  return out
}

export function writeSettings(store: KeyValueStore | null, settings: Settings): void {
  writeJson(store, SETTINGS_KEY, settings)
}
