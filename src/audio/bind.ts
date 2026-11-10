import { watch } from 'vue'
import { bus } from '../bus'
import type { useGame } from '../stores/game'
import { audio, type MusicMode } from './engine'

type Game = ReturnType<typeof useGame>

/** 每個說話的人逐字出現時的音高：周以澄偏亮、沈硯偏低、主管更低 */
const VOICE_PITCH: Record<string, number> = {
  zhou: 880,
  shen: 560,
  jia: 330,
  inner: 700,
  narrator: 440,
}

/** 把遊戲狀態接到音效與音樂。回傳解除函式。 */
export function bindAudio(game: Game): () => void {
  const stops: Array<() => void> = []

  stops.push(
    watch(
      () => game.music,
      (on) => audio.setMusicEnabled(on),
      { immediate: true },
    ),
  )
  stops.push(
    watch(
      () => game.sfx,
      (on) => audio.setSfxEnabled(on),
      { immediate: true },
    ),
  )
  stops.push(
    watch(
      () => game.paused,
      (on) => audio.setDucked(on),
    ),
  )

  // 背景音樂：主管事件時緊張，被約談的結局安靜，其他時候平靜
  const musicMode = (): MusicMode => {
    if (game.bossStage !== 'idle') return 'tense'
    const ending = game.state.ending
    if (game.state.phase === 'ending' && ending?.kind !== 'safe') return 'off'
    return 'calm'
  }
  stops.push(watch(musicMode, (m) => audio.setMode(m), { immediate: true }))

  // 逐字出現的點聲：每兩個字一下
  stops.push(
    watch(
      () => game.lineProgress,
      (n) => {
        const line = game.line
        if (!line || game.paused || n === 0 || n % 2 !== 0 || game.lineComplete) return
        audio.sfx.tick(VOICE_PITCH[line.speaker] ?? 440)
      },
    ),
  )

  stops.push(
    watch(
      () => game.state.phase,
      (phase) => {
        if (phase === 'slotIntro') audio.sfx.ding()
        else if (phase === 'choice') {
          const cur = game.state.current
          audio.sfx.stick(cur?.kind === 'choice' ? cur.options.length : 2)
        } else if (phase === 'ending') {
          audio.sfx.stamp()
          window.setTimeout(
            () => (game.state.ending?.kind === 'safe' ? audio.sfx.success() : audio.sfx.caught()),
            380,
          )
        }
      },
    ),
  )

  stops.push(
    watch(
      () => game.bossStage,
      (stage) => {
        if (stage === 'brief') audio.sfx.bossAlert()
        else if (stage === 'result') {
          const outcome = game.bossResult
          if (outcome === 'caught') audio.sfx.caught()
          else if (outcome === 'awkward') audio.sfx.awkward()
          else audio.sfx.success()
        }
      },
    ),
  )

  stops.push(
    watch(
      () => game.heartPulse?.id,
      () => {
        const pulse = game.heartPulse
        if (pulse) audio.sfx.heartbeat(pulse.strength)
      },
    ),
  )

  stops.push(bus.on('cover:press', () => audio.sfx.cover()))

  // 瀏覽器要使用者操作過一次才能發聲
  const unlock = () => audio.unlock()
  window.addEventListener('keydown', unlock)
  window.addEventListener('pointerdown', unlock)
  stops.push(() => {
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('pointerdown', unlock)
  })

  return () => stops.forEach((stop) => stop())
}
