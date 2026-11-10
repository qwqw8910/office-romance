import type { BossOutcome, CoverId } from './game/types'
import type { CoverPress } from './game/boss'

/** 小遊戲每一幀回報給 UI 的資訊 */
export interface BossFrame {
  t: number
  cue: string | null
  speech: string | null
  cover: { state: 'idle' | 'covering' | 'cooldown'; cover?: CoverId; remaining: number }
  seen: boolean
}

type Events = {
  'cover:press': CoverId
  'boss:frame': BossFrame
  'boss:done': { outcome: BossOutcome; presses: CoverPress[] }
}

type Handler<T> = (payload: T) => void

/** Pixi 與 Vue 之間的小型型別化事件匯流排 */
function createBus() {
  const handlers = new Map<keyof Events, Set<Handler<never>>>()
  return {
    on<K extends keyof Events>(type: K, fn: Handler<Events[K]>): () => void {
      const set = handlers.get(type) ?? new Set()
      set.add(fn as Handler<never>)
      handlers.set(type, set)
      return () => set.delete(fn as Handler<never>)
    },
    emit<K extends keyof Events>(type: K, payload: Events[K]): void {
      handlers.get(type)?.forEach((fn) => (fn as Handler<Events[K]>)(payload))
    },
  }
}

export const bus = createBus()
