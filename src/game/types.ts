/** 男角 */
export type LeadId = 'zhou' | 'shen'
/** 說話者：男角、女主、女主內心、主管、旁白 */
export type SpeakerId = LeadId | 'lin' | 'inner' | 'jia' | 'narrator'
/** 掩護方式：講電話、假裝影印、蹲下撿筆 */
export type CoverId = 'phone' | 'copy' | 'pen'
/** 主管出現模式：巡邏、突襲、回馬槍、最終關組合 */
export type BossPattern = 'patrol' | 'ambush' | 'fakeout' | 'combo'
export type LocationId =
  'desk' | 'pantry' | 'rooftop' | 'copyroom' | 'meeting' | 'elevator' | 'office'

export interface Line {
  kind: 'line'
  speaker: SpeakerId
  text: string
  /** 佔位表情，例如「臉紅」 */
  mood?: string
}

export interface Effect {
  lead: LeadId
  delta: number
}

export interface ChoiceOption {
  text: string
  effects?: Effect[]
  /** 選完後設定旗標，例如午休和誰一起 */
  flag?: [key: string, value: string]
  /** 大膽的選項：累積熱度，讓下一次主管事件更難 */
  risk?: number
  then?: Line[]
}

export interface Choice {
  kind: 'choice'
  options: ChoiceOption[]
}

export interface BossEvent {
  kind: 'boss'
  pattern: BossPattern
  /** 這個場景判定為合適的掩護 */
  cover: CoverId
  /** 這個事件和哪位男角一起（成功加好感、尷尬扣好感） */
  lead: LeadId
  /** 只在第一次出現的提示 */
  hint?: string
  success: Line[]
  awkward: Line[]
  caught: Line[]
}

export type Beat = Line | Choice | BossEvent

export interface Slot {
  id: string
  /** 顯示用時間，例如 09:00 */
  time: string
  title: string
  location: LocationId
  /** 固定劇情；或依好感最高的男角選分支（走隱藏路線時用 pair） */
  beats: Beat[] | { byLead: Record<LeadId, Beat[]>; pair?: Beat[] }
}

export interface Script {
  opening: Line[]
  slots: Slot[]
  endings: {
    safe: Record<LeadId, Line[]>
    caught: Line[]
    /** 兩人好感都不夠：一個人下班 */
    alone: Line[]
    /** 隱藏結局：女主幫兩位男角牽線 */
    pair: Line[]
  }
  /** 被抓時，好感夠高的男角出來救場（每天一次） */
  rescue: Record<LeadId, Line[]>
}

export type Ending =
  { kind: 'safe'; lead: LeadId } | { kind: 'caught' } | { kind: 'alone' } | { kind: 'pair' }

export type BossOutcome = 'success' | 'awkward' | 'caught'
