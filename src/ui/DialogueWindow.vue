<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { SPEAKER_NAMES } from '../content/day1'
import { affectionStatus } from '../game/affection'

const game = useGame()

const active = computed(() => game.state.phase === 'line')
const shown = computed(() => (active.value ? game.line : game.lastLine))
const text = computed(() => {
  const l = shown.value
  if (!l) return ''
  return active.value ? l.text.slice(0, game.lineProgress) : l.text
})

const speaker = computed(() => shown.value?.speaker ?? 'narrator')
const name = computed(() => SPEAKER_NAMES[speaker.value])

const STATUS_TEXT = { unread: '未讀', read: '已讀', typing: '已讀・對方輸入中…' } as const
const status = computed(() => {
  const s = speaker.value
  if (s !== 'zhou' && s !== 'shen') return null
  const key = affectionStatus(game.state.affection[s])
  return { key, text: STATUS_TEXT[key] }
})

const variant = computed(() => {
  if (speaker.value === 'inner') return 'memo'
  if (speaker.value === 'narrator') return 'narrator'
  if (speaker.value === 'jia') return 'boss'
  return 'chat'
})

function onClick() {
  if (active.value) game.advance()
}
</script>

<template>
  <section
    v-if="shown"
    class="window"
    :class="[variant, { waiting: !active }]"
    aria-label="對話"
    @click="onClick"
  >
    <header v-if="variant !== 'narrator'" class="bar">
      <span class="who">{{ variant === 'memo' ? '備忘錄' : name }}</span>
      <span v-if="status" class="status" :class="status.key">{{ status.text }}</span>
      <!-- 立繪已經用表情演出 mood，文字只留給螢幕閱讀器 -->
      <span v-if="shown.mood" class="sr-only">（{{ shown.mood }}）</span>
    </header>
    <p class="text" aria-hidden="true">{{ text }}</p>
    <p class="sr-only" aria-live="polite">{{ name }}{{ name ? '：' : '' }}{{ shown.text }}</p>
    <button
      v-if="active"
      class="next"
      type="button"
      :aria-label="game.lineComplete ? '下一句' : '顯示全文'"
      @click.stop="game.advance()"
    >
      <svg v-if="game.lineComplete" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path d="M4 7l6 7 6-7z" fill="currentColor" />
      </svg>
      <span v-else aria-hidden="true">略過</span>
    </button>
  </section>
</template>

<style scoped>
.window {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 24px;
  min-height: 196px;
  background: var(--paper);
  cursor: pointer;
  animation: rise var(--t-enter) var(--ease-out) both;
}

.window.waiting {
  cursor: default;
}

.bar {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 10px 28px;
  background: var(--panel);
  font-size: var(--fs-name);
}

.who {
  font-weight: 700;
}

.status {
  font-size: 15px;
  color: var(--ink-2);
}

.status.typing {
  color: var(--heart);
  font-weight: 700;
}

.text {
  padding: 18px 96px 28px 28px;
  font-size: var(--fs-dialogue);
  line-height: 1.6;
  min-height: 3.2em;
  max-width: 44em;
}

.memo {
  background: var(--memo);
}

.memo .bar {
  background: var(--memo);
  color: var(--ink-2);
  padding-bottom: 0;
}

.boss .bar {
  background: var(--panel-deep);
}

.narrator .text {
  padding-top: 30px;
}

.next {
  position: absolute;
  right: 20px;
  bottom: 18px;
  min-width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  padding: 0 12px;
  background: var(--ink);
  color: var(--paper);
  font-size: 15px;
  font-weight: 700;
  transition: transform var(--t-micro) var(--ease-out);
}

.next:hover {
  transform: translateY(2px);
}

@keyframes rise {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
</style>
