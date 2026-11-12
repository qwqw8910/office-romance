<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { COVER_NAMES } from '../content/day1'
import type { CoverId } from '../game/types'
import { canRescue } from '../game/director'

const game = useGame()
const covers = Object.entries(COVER_NAMES) as [CoverId, string][]
const readyBtn = ref<HTMLButtonElement>()
const coverBtn = ref<HTMLButtonElement>()

const event = computed(() => game.bossEvent)
const showHint = computed(() => event.value?.hint && !game.seenHints.has(event.value.hint))
/** 被抓時男角會不會出來救場（結果顯示時 state 還沒更新，可以直接判斷） */
const rescuing = computed(
  () => game.bossResult === 'caught' && !!event.value && canRescue(game.state, event.value),
)
const resultText = computed(() => {
  const r = game.bossResult
  if (!r) return ''
  return rescuing.value ? '——但有人衝了出來。' : RESULT[r].text
})

const PATTERN_TEXT = {
  patrol: '例行巡視',
  ambush: '臨時突襲',
  fakeout: '假裝離開',
  combo: '下班前最後巡視',
} as const

const RESULT = {
  success: { stamp: '過關', text: '他什麼都沒發現。' },
  awkward: { stamp: '尷尬過關', text: '掩護方式不太對，氣氛被打斷了。' },
  caught: { stamp: '被抓', text: '約談 +1。' },
} as const

const cover = computed(() => game.frame?.cover)
const coverLabel = computed(() => {
  const c = cover.value
  if (!c || c.state === 'idle') return '掩護'
  if (c.state === 'covering') return `掩護中 ${c.remaining.toFixed(1)}`
  return `冷卻 ${c.remaining.toFixed(1)}`
})

watch(
  () => game.bossStage,
  async (stage) => {
    await nextTick()
    if (stage === 'brief') readyBtn.value?.focus()
    if (stage === 'running') coverBtn.value?.focus()
  },
  { immediate: true },
)
</script>

<template>
  <section
    v-if="event && game.bossStage !== 'idle'"
    class="invite"
    role="alertdialog"
    aria-labelledby="invite-title"
    aria-describedby="invite-desc"
  >
    <header class="bar">
      <span>會議邀請</span>
      <span class="when">現在</span>
    </header>
    <div class="body">
      <h2 id="invite-title">賈正經 邀請你參加：{{ PATTERN_TEXT[event.pattern] }}</h2>

      <template v-if="game.bossStage === 'brief'">
        <p id="invite-desc" class="desc">
          {{ showHint ? event.hint : '看準他的動線，在他看到你之前掩護。' }}
        </p>
        <p v-if="game.bossHeat > 0" class="heat">
          剛剛太明顯了，經理比平常警覺：視線更遠、來得更快。
        </p>
        <button ref="readyBtn" class="btn btn--alert" type="button" @click="game.startBoss()">
          準備好了 <kbd>Enter</kbd>
        </button>
      </template>

      <template v-else-if="game.bossStage === 'running'">
        <p id="invite-desc" class="live" aria-live="assertive">
          <span v-if="game.frame?.speech" class="speech">賈正經：「{{ game.frame.speech }}」</span>
          <span v-else-if="game.frame?.cue" class="cue">{{ game.frame.cue }}</span>
          <span v-else class="quiet">他在附近……</span>
        </p>
        <div class="controls">
          <div class="picker" role="group" aria-label="掩護方式">
            <button
              v-for="([id, label], i) in covers"
              :key="id"
              type="button"
              class="pick"
              :aria-pressed="game.selectedCover === id"
              @click="game.selectCover(id)"
            >
              <kbd aria-hidden="true">{{ i + 1 }}</kbd
              >{{ label }}
            </button>
          </div>
          <button
            ref="coverBtn"
            class="btn btn--heart cover"
            type="button"
            :aria-disabled="cover?.state !== undefined && cover.state !== 'idle'"
            @click="game.pressCover()"
          >
            {{ coverLabel }} <kbd>Space</kbd>
          </button>
        </div>
      </template>

      <template v-else-if="game.bossResult">
        <div id="invite-desc" class="result" :class="game.bossResult" aria-live="assertive">
          <span class="stamp">{{ RESULT[game.bossResult].stamp }}</span>
          <p>{{ resultText }}</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.heat {
  margin-top: 10px;
  font-weight: 700;
  color: var(--alert);
}

.invite {
  position: absolute;
  right: var(--gutter);
  bottom: 24px;
  width: 560px;
  background: var(--paper);
  box-shadow: 0 18px 40px rgb(20 22 26 / 0.22);
  animation: slide 240ms var(--ease-out) both;
}

.bar {
  display: flex;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--alert);
  color: var(--alert-ink);
  font-weight: 700;
}

.body {
  padding: 20px 24px 24px;
}

h2 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.desc {
  margin-top: 12px;
  font-size: 18px;
  line-height: 1.6;
}

.btn {
  margin-top: 20px;
}

.live {
  margin-top: 12px;
  min-height: 2em;
  font-size: 20px;
  font-weight: 700;
}

.cue {
  color: var(--alert);
}

.quiet {
  color: var(--ink-2);
  font-weight: 400;
}

.controls {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 16px;
}

.picker {
  display: grid;
  gap: 6px;
}

.pick {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 6px 14px 6px 8px;
  background: var(--panel);
  font-size: 17px;
  text-align: left;
  transition: background-color var(--t-micro) var(--ease-out);
}

.pick:hover {
  background: var(--panel-deep);
}

.pick[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
  font-weight: 700;
}

.pick[aria-pressed='true'] kbd {
  background: rgb(255 255 255 / 0.22);
  color: inherit;
}

.cover {
  flex: 1;
  justify-content: center;
  font-size: 24px;
  margin-top: 0;
}

.cover[aria-disabled='true'] {
  background: var(--panel-deep);
  color: var(--ink);
  transform: none;
}

.result {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 18px;
}

.stamp {
  flex: none;
  min-width: 112px;
  height: 112px;
  padding: 0 12px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 24px;
  font-weight: 700;
  transform: rotate(-10deg);
  animation: stamp 280ms var(--ease-out) both;
}

.success .stamp {
  background: var(--heart);
  color: var(--heart-ink);
}

.awkward .stamp {
  background: var(--note);
  color: var(--ink);
  font-size: 20px;
}

.caught .stamp {
  background: var(--alert);
  color: var(--alert-ink);
}

@keyframes slide {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes stamp {
  from {
    transform: rotate(-10deg) scale(1.6);
    opacity: 0;
  }
  to {
    transform: rotate(-10deg) scale(1);
    opacity: 1;
  }
}
</style>
