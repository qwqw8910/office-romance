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

function beatsFor(slot: Slot, state: GameState): Beat[] {
  if (Array.isArray(slot.beats)) return [...slot.beats]
  return [...slot.beats.byLead[leaderOf(state)]]
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

  const lead = leaderOf(state)
  state.ending = { kind: 'safe', lead }
  state.queue = [...script.endings.safe[lead]]
  next(state, script)
}

export function choose(state: GameState, script: Script, index: number): void {
  const beat = state.current
  if (state.phase !== 'choice' || beat?.kind !== 'choice') return
  const option = beat.options[index]
  if (!option) return
  applyEffects(state.affection, option.effects)
  if (option.flag) state.flags[option.flag[0]] = option.flag[1]
  state.queue.unshift(...(option.then ?? []))
  next(state, script)
}

export function resolveBoss(state: GameState, script: Script, outcome: BossOutcome): void {
  const beat = state.current
  if (state.phase !== 'boss' || beat?.kind !== 'boss') return
  const event: BossEvent = beat
  state.bossLog.push({ slotId: currentSlot(state, script)?.id ?? 'opening', outcome })

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

/** 除錯用：直接跳到指定時段（1 起算） */
export function jumpToSlot(state: GameState, script: Script, slotNumber: number): void {
  Object.assign(state, createState())
  state.slotIndex = Math.max(-1, Math.min(script.slots.length - 1, slotNumber - 2))
  next(state, script)
}
