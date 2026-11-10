<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { HEART_PERIOD_MS } from '../audio/engine'

/**
 * 心跳演出：男角臉紅時，臉旁邊一顆愛心「咚—咚」跳動，幾顆小愛心飄起。
 * 愛心是平塗 SVG（--heart），沒有光暈與漸層。
 * 減少動態效果時只留一顆靜止的愛心，淡入淡出。
 */
const game = useGame()
const visibleId = ref<number | null>(null)
let hideTimer: number | undefined

const pulse = computed(() => (visibleId.value === game.heartPulse?.id ? game.heartPulse : null))
const beats = computed(() => (pulse.value?.strength === 'strong' ? 3 : 2))
const floaters = computed(() => {
  const n = pulse.value?.strength === 'strong' ? 6 : 4
  // 固定的散布，不用亂數，同一句每次重播都一樣
  const dx = [-26, 34, 6, -48, 52, -12]
  const size = [15, 12, 18, 11, 14, 16]
  return Array.from({ length: n }, (_, i) => ({
    dx: dx[i]!,
    size: size[i]!,
    delay: 260 + i * 190,
  }))
})

const lifeMs = computed(() => beats.value * HEART_PERIOD_MS + 900)

watch(
  () => game.heartPulse?.id,
  (id) => {
    if (id === undefined) {
      visibleId.value = null
      return
    }
    visibleId.value = id
    window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(
      () => (visibleId.value = null),
      game.reducedMotion ? 1400 : lifeMs.value,
    )
  },
)

// 換場景或離開對話時立刻收掉
watch(
  () => game.state.phase,
  (phase) => {
    if (phase !== 'line' && phase !== 'choice') visibleId.value = null
  },
)
onBeforeUnmount(() => window.clearTimeout(hideTimer))

const HEART_PATH =
  'M12 21C5 15 1 11.5 1 7c0-3.5 2.8-6 6-6 2.2 0 4 1.2 5 3 1-1.8 2.8-3 5-3 3.2 0 6 2.5 6 6 0 4.5-4 8-11 14z'
</script>

<template>
  <div
    v-if="pulse"
    :key="pulse.id"
    class="fx"
    :class="{ calm: game.reducedMotion }"
    :style="{ '--beats': beats, '--period': `${HEART_PERIOD_MS}ms`, '--life': `${lifeMs}ms` }"
    aria-hidden="true"
  >
    <svg class="heart main" viewBox="0 0 24 22" width="52" height="48">
      <path :d="HEART_PATH" />
    </svg>
    <template v-if="!game.reducedMotion">
      <svg
        v-for="(f, i) in floaters"
        :key="i"
        class="heart float"
        viewBox="0 0 24 22"
        :width="f.size * 1.4"
        :height="f.size * 1.3"
        :style="{ '--dx': `${f.dx}px`, '--delay': `${f.delay}ms` }"
      >
        <path :d="HEART_PATH" />
      </svg>
    </template>
  </div>
</template>

<style scoped>
.fx {
  position: absolute;
  left: 872px;
  top: 214px;
  width: 52px;
  height: 48px;
  pointer-events: none;
  animation: life var(--life) linear both;
}

.heart {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
}

.heart path {
  fill: var(--heart);
  stroke: var(--paper);
  stroke-width: 1.6;
  stroke-linejoin: round;
  paint-order: stroke;
}

.main {
  transform-origin: 50% 60%;
  animation: beat var(--period) var(--ease-out) var(--beats) both;
}

.float {
  left: 14px;
  opacity: 0;
  animation: float 1700ms var(--ease-out) var(--delay) both;
}

/* 減少動態效果：一顆靜止的愛心，由元件的計時器移除，不靠動畫 */
.calm,
.calm .main {
  animation: none;
}

@keyframes life {
  0% {
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* 咚—咚：第一下大、第二下稍小，之後靜止到下一個週期 */
@keyframes beat {
  0% {
    transform: scale(0.8);
  }
  10% {
    transform: scale(1.3);
  }
  21% {
    transform: scale(0.98);
  }
  31% {
    transform: scale(1.18);
  }
  46%,
  100% {
    transform: scale(1);
  }
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), -150px) scale(1);
  }
}
</style>
