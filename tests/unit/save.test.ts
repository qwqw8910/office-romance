import { describe, expect, it } from 'vitest'
import { createState, next, startGame } from '../../src/game/director'
import {
  clearSave,
  readSave,
  readSettings,
  SAVE_KEY,
  writeSave,
  writeSettings,
  type KeyValueStore,
} from '../../src/game/save'
import { day1 } from '../../src/content/day1'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const view = { onStage: null, expression: 'normal', lastLine: null }

function midGame() {
  const s = createState()
  startGame(s, day1)
  for (let i = 0; i < 6 && s.phase === 'line'; i++) next(s, day1)
  return s
}

describe('save', () => {
  it('round-trips the game state', () => {
    const store = memoryStore()
    const state = midGame()
    writeSave(store, day1, state, view)
    const loaded = readSave(store, day1)
    expect(loaded?.state).toEqual(JSON.parse(JSON.stringify(state)))
    expect(loaded?.view).toEqual(view)
  })

  it('ignores a save made with a different script', () => {
    const store = memoryStore()
    writeSave(store, day1, midGame(), view)
    const changed = { ...day1, opening: day1.opening.slice(1) }
    expect(readSave(store, changed)).toBeNull()
  })

  it('ignores title and ending states', () => {
    const store = memoryStore()
    writeSave(store, day1, createState(), view)
    expect(readSave(store, day1)).toBeNull()
  })

  it('ignores corrupt data and survives a missing store', () => {
    const store = memoryStore()
    store.setItem(SAVE_KEY, '{not json')
    expect(readSave(store, day1)).toBeNull()
    expect(readSave(null, day1)).toBeNull()
    expect(() => writeSave(null, day1, midGame(), view)).not.toThrow()
  })

  it('clears the save', () => {
    const store = memoryStore()
    writeSave(store, day1, midGame(), view)
    clearSave(store)
    expect(readSave(store, day1)).toBeNull()
  })

  it('keeps only valid settings', () => {
    const store = memoryStore()
    writeSettings(store, { typewriter: false, reducedMotion: true })
    expect(readSettings(store)).toEqual({ typewriter: false, reducedMotion: true })
    store.setItem('office-romance:settings', '{"typewriter":"yes"}')
    expect(readSettings(store)).toEqual({})
  })
})
