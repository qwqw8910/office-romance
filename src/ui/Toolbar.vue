<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

/** 左上角的兩顆圖示鈕：暫停與設定、聲音開關。滑鼠玩家不用知道 Esc 和 M。 */
const game = useGame()
const soundOn = computed(() => game.music || game.sfx)

function toggleSound() {
  const next = !soundOn.value
  game.music = next
  game.sfx = next
}

/** 滑鼠點完就放掉焦點，免得之後按 Enter 變成再點一次這顆鈕而不是推進對話 */
function release(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).blur()
}
</script>

<template>
  <div class="toolbar">
    <button
      type="button"
      class="tool"
      aria-label="暫停與設定（Esc）"
      title="暫停與設定（Esc）"
      @click="game.paused = true"
      @pointerup="release"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" fill="currentColor" />
        <rect x="14" y="5" width="4" height="14" fill="currentColor" />
      </svg>
    </button>
    <button
      type="button"
      class="tool"
      :aria-label="soundOn ? '關閉聲音（M）' : '開啟聲音（M）'"
      :aria-pressed="soundOn"
      :title="soundOn ? '關閉聲音（M）' : '開啟聲音（M）'"
      @click="toggleSound"
      @pointerup="release"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor" />
        <template v-if="soundOn">
          <path
            d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
        <path
          v-else
          d="M16 9l6 6M22 9l-6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  left: var(--gutter);
  top: 24px;
  display: flex;
  gap: 8px;
}

.tool {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: var(--paper);
  color: var(--ink);
  transition:
    transform var(--t-micro) var(--ease-out),
    background-color var(--t-micro) var(--ease-out);
}

.tool:hover {
  background: var(--panel-deep);
  transform: translateY(-2px);
}

.tool:active {
  transform: translateY(1px);
}
</style>
