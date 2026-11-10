<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watchEffect } from 'vue'
import { useGame } from './stores/game'
import { createStage, STAGE_H, STAGE_W, type Stage } from './scenes/stage'
import type { CoverId, LocationId } from './game/types'
import TitleCard from './ui/TitleCard.vue'
import ClockSheet from './ui/ClockSheet.vue'
import DialogueWindow from './ui/DialogueWindow.vue'
import ChoiceNotes from './ui/ChoiceNotes.vue'
import SlotIntro from './ui/SlotIntro.vue'
import BossAlert from './ui/BossAlert.vue'
import EndingCard from './ui/EndingCard.vue'
import PauseMenu from './ui/PauseMenu.vue'

const game = useGame()
const host = ref<HTMLDivElement>()
const stage = shallowRef<Stage | null>(null)

// ── 等比縮放 16:9 舞台 ─────────────────────────────────
const scale = ref(1)
function fit() {
  scale.value = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
}

// ── 狀態 → Pixi ───────────────────────────────────────
const phase = computed(() => game.state.phase)
const location = computed<LocationId>(() => {
  const ending = game.state.ending
  if (ending && phase.value !== 'boss') return ending.kind === 'safe' ? 'elevator' : 'office'
  return game.slot?.location ?? 'desk'
})

watchEffect(() => {
  const s = stage.value
  if (!s) return
  s.office.reducedMotion = game.reducedMotion
  s.minigame.reducedMotion = game.reducedMotion
  s.minigame.paused = game.paused
  s.office.setLocation(location.value)
  const showCast = !['title', 'slotIntro', 'ending'].includes(phase.value)
  s.office.setCast(showCast ? game.onStage : null, showCast && game.jiaOnStage)
})

watchEffect(() => {
  const s = stage.value
  if (!s) return
  const event = game.bossEvent
  if (game.bossStage === 'brief' && game.timeline && event) {
    s.minigame.prepare(game.timeline, event.cover, event.lead)
  } else if (game.bossStage === 'running') {
    s.minigame.run()
  } else if (game.bossStage === 'idle') {
    s.minigame.hide()
  }
})

// ── 鍵盤 ──────────────────────────────────────────────
const COVER_KEYS: Record<string, CoverId> = { '1': 'phone', '2': 'copy', '3': 'pen' }

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const onControl = !!target?.closest('button, input, label, a')
  const confirm = e.key === 'Enter' || e.key === ' '

  if (e.key === 'Escape') {
    if (phase.value !== 'title' && phase.value !== 'ending') game.paused = !game.paused
    return
  }
  if (game.paused || phase.value === 'title') return

  if (game.bossStage === 'running') {
    if (e.key === ' ') {
      e.preventDefault()
      if (!e.repeat) game.pressCover()
    } else if (COVER_KEYS[e.key]) {
      game.selectCover(COVER_KEYS[e.key]!)
    }
    return
  }
  if (game.bossStage === 'brief') {
    if (confirm && !onControl) {
      e.preventDefault()
      game.startBoss()
    }
    return
  }
  if (game.bossStage === 'result') return

  if (phase.value === 'choice' && /^[1-3]$/.test(e.key)) {
    game.choose(Number(e.key) - 1)
    return
  }
  if ((phase.value === 'line' || phase.value === 'slotIntro') && confirm && !onControl) {
    e.preventDefault()
    if (!e.repeat) game.advance()
  }
}

function restart() {
  game.restart()
}

onMounted(async () => {
  fit()
  window.addEventListener('resize', fit)
  window.addEventListener('keydown', onKey)
  // Pixi 文字要等字型載入，最多等 1.5 秒
  await Promise.race([
    document.fonts?.load('700 20px "Noto Sans TC"').catch(() => undefined),
    new Promise((r) => setTimeout(r, 1500)),
  ])
  if (host.value) stage.value = await createStage(host.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fit)
  window.removeEventListener('keydown', onKey)
  stage.value?.destroy()
})
</script>

<template>
  <div class="viewport" :class="{ 'reduced-motion': game.reducedMotion }">
    <main
      class="stage"
      :style="{ transform: `translate(-50%, -50%) scale(${scale})` }"
      :data-phase="phase"
      :data-boss="game.bossStage"
    >
      <div ref="host" class="canvas"></div>

      <div class="ui">
        <TitleCard v-if="phase === 'title'" @start="game.start()" />

        <template v-else>
          <ClockSheet v-if="game.bossStage === 'idle' || game.bossStage === 'brief'" />
          <SlotIntro v-if="phase === 'slotIntro'" :key="game.state.slotIndex" />
          <DialogueWindow v-if="phase === 'line' || phase === 'choice'" />
          <ChoiceNotes v-if="phase === 'choice'" :key="`c${game.state.slotIndex}`" />
          <BossAlert />
          <EndingCard v-if="phase === 'ending'" @restart="restart" />
        </template>

        <PauseMenu v-if="game.paused" @restart="restart" />

        <dl v-if="game.debug" class="debug">
          <div>
            <dt>周以澄</dt>
            <dd>{{ game.state.affection.zhou }}</dd>
          </div>
          <div>
            <dt>沈硯</dt>
            <dd>{{ game.state.affection.shen }}</dd>
          </div>
          <div>
            <dt>約談</dt>
            <dd>{{ game.state.suspicion }}</dd>
          </div>
          <div>
            <dt>seed</dt>
            <dd>{{ game.seed }}</dd>
          </div>
        </dl>
      </div>
    </main>
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  background: var(--paper-deep);
}

.stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1280px;
  height: 720px;
  overflow: hidden;
  background: var(--paper);
  transform-origin: 50% 50%;
}

.canvas,
.ui {
  position: absolute;
  inset: 0;
}

.canvas :deep(canvas) {
  display: block;
}

.debug {
  position: absolute;
  left: var(--gutter);
  top: 24px;
  margin: 0;
  padding: 8px 12px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  display: flex;
  gap: 16px;
}

.debug div {
  display: flex;
  gap: 6px;
}

.debug dd {
  margin: 0;
  font-weight: 700;
}
</style>
