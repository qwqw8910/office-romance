import type { Effect, LeadId } from './types'
import { tuning } from './tuning'

export type Affection = Record<LeadId, number>
/** 介面上顯示的訊息狀態，取代數值條 */
export type AffectionStatus = 'unread' | 'read' | 'typing'

export const LEADS: readonly LeadId[] = ['zhou', 'shen']

export function initialAffection(): Affection {
  return { zhou: tuning.affection.start, shen: tuning.affection.start }
}

export function clampAffection(value: number): number {
  return Math.min(tuning.affection.max, Math.max(tuning.affection.min, value))
}

export function applyEffects(affection: Affection, effects: readonly Effect[] = []): void {
  for (const { lead, delta } of effects) {
    affection[lead] = clampAffection(affection[lead] + delta)
  }
}

export function affectionStatus(value: number): AffectionStatus {
  if (value >= tuning.affection.typingAt) return 'typing'
  if (value >= tuning.affection.readAt) return 'read'
  return 'unread'
}

/** 好感度較高的男角；同分時用 tiebreak（例如午休選的人），沒有就選周以澄 */
export function leadingLead(affection: Affection, tiebreak?: LeadId): LeadId {
  if (affection.zhou > affection.shen) return 'zhou'
  if (affection.shen > affection.zhou) return 'shen'
  return tiebreak ?? 'zhou'
}
