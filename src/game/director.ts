import type { Beat, BossEvent, BossOutcome, Ending, LeadId, Script, Slot } from './types'
import { applyEffects, initialAffection, leadingLead, type Affection } from './affection'
import { addSuspicion, isBusted } from './suspicion'
import { tuning } from './tuning'

/**
 * 遊戲流程狀態機。純資料、無畫面依賴：
 * title → opening(line…) → [slotIntro → line/choice/boss …] × N → ending lines → ending
 */
export type Phase = 'title' | 'slotIntro' | 'line' | 'choice' | 'boss' | 'ending'

export interface BossRecord {
  slotId: string
  outcome: BossOutcome
  /** 被抓但男角出來救場 */
  rescued?: boolean
}

export interface GameState {
  phase: Phase
  /** -1 代表開場 */
  slotIndex: number
  queue: Beat[]
  current: Beat | null
  affection: Affection
  suspicion: number
  flags: Record<string, string>
  /** 大膽選項累積的熱度，下一次主管事件結束後歸零 */
  heat: number
  ending: Ending | null
  bossLog: BossRecord[]
}

export function createState(): GameState {
  return {
    phase: 'title',
    slotIndex: -1,
    queue: [],
    current: null,
    affection: initialAffection(),
    suspicion: 0,
    flags: {},
    heat: 0,
    ending: null,
    bossLog: [],
  }
}

export function currentSlot(state: GameState, script: Script): Slot | null {
  return script.slots[state.slotIndex] ?? null
}

/** 平手時用午休選的人決勝 */
function tiebreak(state: GameState): LeadId | undefined {
  const v = state.flags.lunch
  return v === 'zhou' || v === 'shen' ? v : undefined
}

export function leaderOf(state: GameState): LeadId {
  return leadingLead(state.affection, tiebreak(state))
}

/**
 * 隱藏路線：茶水間把咖啡推給周以澄、午休叫兩人一起，且沒有跟任何一人走太近。
 * 在最後一個時段開始時判定一次，記在 flags.route，結局沿用同一個判定。
 */
export function isPairRoute(state: GameState): boolean {
  return (
    state.flags.matchmake === 'pantry' &&
    state.flags.lunch === 'both' &&
    Math.max(state.affection.zhou, state.affection.shen) < tuning.affection.typingAt
  )
}

function beatsFor(slot: Slot, state: GameState): Beat[] {
  if (Array.isArray(slot.beats)) return [...slot.beats]
  if (slot.beats.pair && isPairRoute(state)) {
    state.flags.route = 'pair'
    return [...slot.beats.pair]
  }
  return [...slot.beats.byLead[leaderOf(state)]]
}

/** 一天結束時的結局（被約談在 resolveBoss 當下就決定） */
export function endingFor(state: GameState): Ending {
  if (state.flags.route === 'pair') return { kind: 'pair' }
  if (Math.max(state.affection.zhou, state.affection.shen) < tuning.affection.readAt)
    return { kind: 'alone' }
  return { kind: 'safe', lead: leaderOf(state) }
}

function endingLines(script: Script, ending: Ending) {
  if (ending.kind === 'safe') return script.endings.safe[ending.lead]
  return script.endings[ending.kind]
}

export function startGame(state: GameState, script: Script): void {
  Object.assign(state, createState())
  state.queue = [...script.opening]
  next(state, script)
}

/** 推進到下一個節拍；台詞與時段開頭由玩家按鍵呼叫，選項與主管事件由各自的函式呼叫 */
export function next(state: GameState, script: Script): void {
  const beat = state.queue.shift()
  if (beat) {
    state.current = beat
    state.phase = beat.kind === 'line' ? 'line' : beat.kind
    return
  }
  state.current = null

  if (state.ending) {
    state.phase = 'ending'
    return
  }

  const nextIndex = state.slotIndex + 1
  const slot = script.slots[nextIndex]
  if (slot) {
    state.slotIndex = nextIndex
    state.queue = beatsFor(slot, state)
    state.phase = 'slotIntro'
    return
  }

  state.ending = endingFor(state)
  state.queue = [...endingLines(script, state.ending)]
  next(state, script)
}

export function choose(state: GameState, script: Script, index: number): void {
  const beat = state.current
  if (state.phase !== 'choice' || beat?.kind !== 'choice') return
  const option = beat.options[index]
  if (!option) return
  applyEffects(state.affection, option.effects)
  state.heat += option.risk ?? 0
  if (option.flag) state.flags[option.flag[0]] = option.flag[1]
  state.queue.unshift(...(option.then ?? []))
  next(state, script)
}

export function resolveBoss(state: GameState, script: Script, outcome: BossOutcome): void {
  const beat = state.current
  if (state.phase !== 'boss' || beat?.kind !== 'boss') return
  const event: BossEvent = beat
  const slotId = currentSlot(state, script)?.id ?? 'opening'
  state.heat = 0

  if (outcome === 'caught' && canRescue(state, event)) {
    state.flags.rescued = event.lead
    state.bossLog.push({ slotId, outcome, rescued: true })
    state.queue.unshift(...script.rescue[event.lead])
    next(state, script)
    return
  }
  state.bossLog.push({ slotId, outcome })

  if (outcome === 'success') {
    applyEffects(state.affection, [{ lead: event.lead, delta: tuning.boss.successBonus }])
    state.queue.unshift(...event.success)
  } else if (outcome === 'awkward') {
    applyEffects(state.affection, [{ lead: event.lead, delta: tuning.boss.awkwardPenalty }])
    state.queue.unshift(...event.awkward)
  } else {
    state.suspicion = addSuspicion(state.suspicion)
    if (isBusted(state.suspicion)) {
      state.ending = { kind: 'caught' }
      state.queue = [...event.caught, ...script.endings.caught]
    } else {
      state.queue.unshift(...event.caught)
    }
  }
  next(state, script)
}

/** 男角救場：每天一次，事件男角好感夠高 */
export function canRescue(state: GameState, event: BossEvent): boolean {
  return !state.flags.rescued && state.affection[event.lead] >= tuning.rescueAt
}

/** 除錯用：直接跳到指定時段（1 起算） */
export function jumpToSlot(state: GameState, script: Script, slotNumber: number): void {
  Object.assign(state, createState())
  state.slotIndex = Math.max(-1, Math.min(script.slots.length - 1, slotNumber - 2))
  next(state, script)
}
