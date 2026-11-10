<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { art } from '../content/expressions'
import { DEFAULT_PLAYER_NAME, MAX_NAME_LENGTH, sanitizeName } from '../game/personalize'
import { useGame } from '../stores/game'

defineEmits<{ start: [name: string]; continue: [] }>()
const game = useGame()
const nameInput = ref(game.playerName === DEFAULT_PLAYER_NAME ? '' : game.playerName)
const shownName = computed(() => sanitizeName(nameInput.value))
const startBtn = ref<HTMLButtonElement>()
const continueBtn = ref<HTMLButtonElement>()
onMounted(() => (continueBtn.value ?? startBtn.value)?.focus())

/** 存檔停在哪裡，例如「10:30 茶水間」 */
const savedAt = computed(() => {
  const data = game.savedGame
  if (!data) return null
  const slot = game.script.slots[data.state.slotIndex]
  return slot ? `${slot.time} ${slot.title}` : '上班前'
})
</script>

<template>
  <section class="title" aria-labelledby="game-title">
    <div class="pitch">
      <h1 id="game-title">辦公室心動日常</h1>
      <p class="lede">
        在主管眼皮底下，談一場不能被發現的曖昧。從九點撐到六點，看準他的動線，及時掩護。
      </p>
      <label class="namefield">
        <span>你的名字</span>
        <input
          v-model="nameInput"
          type="text"
          :maxlength="MAX_NAME_LENGTH"
          :placeholder="DEFAULT_PLAYER_NAME"
          autocomplete="off"
          @keydown.enter.prevent="!$event.isComposing && $emit('start', nameInput)"
        />
        <small>同事會這樣叫你，最多 {{ MAX_NAME_LENGTH }} 個字</small>
      </label>
      <div class="actions">
        <button
          v-if="savedAt"
          ref="continueBtn"
          class="btn btn--heart start"
          type="button"
          @click="$emit('continue')"
        >
          繼續上班 <span class="where">{{ savedAt }}</span>
        </button>
        <button
          ref="startBtn"
          class="btn start"
          :class="savedAt ? 'btn--quiet' : 'btn--heart'"
          type="button"
          @click="$emit('start', nameInput)"
        >
          {{ savedAt ? '重新開始' : '開始上班' }} <kbd>Enter</kbd>
        </button>
      </div>
      <dl class="keys">
        <div>
          <dt>推進對話</dt>
          <dd><kbd>Enter</kbd> 或 <kbd>Space</kbd></dd>
        </div>
        <div>
          <dt>選擇選項</dt>
          <dd><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dd>
        </div>
        <div>
          <dt>主管來了</dt>
          <dd><kbd>Space</kbd> 掩護，<kbd>1</kbd>–<kbd>3</kbd> 換方式</dd>
        </div>
        <div>
          <dt>暫停與設定</dt>
          <dd><kbd>Esc</kbd></dd>
        </div>
        <div>
          <dt>聲音開關</dt>
          <dd><kbd>M</kbd></dd>
        </div>
      </dl>
    </div>

    <div class="badge" aria-label="員工識別證">
      <div class="slot" aria-hidden="true"></div>
      <p class="company">日常股份有限公司</p>
      <img class="photo" :src="art.badge()" alt="識別證照片" width="140" height="160" />
      <p class="name">林{{ shownName }}</p>
      <p class="role">企劃部 資深企劃</p>
      <p class="no">員工編號 0915</p>
    </div>
  </section>
</template>

<style scoped>
.title {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 64px;
  align-items: center;
  padding: 0 96px;
  background: var(--paper);
}

h1 {
  font-size: 88px;
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.lede {
  margin-top: 36px;
  max-width: 30em;
  font-size: 22px;
  line-height: 1.6;
}

.namefield {
  margin-top: 32px;
  display: grid;
  gap: 6px;
  max-width: 20em;
}

.namefield span {
  font-weight: 700;
}

.namefield input {
  min-height: 48px;
  padding: 8px 14px;
  font: inherit;
  font-size: 20px;
  color: var(--ink);
  background: var(--paper);
  border: 2px solid var(--ink);
}

.namefield small {
  color: var(--ink-2);
}

.actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.where {
  font-size: var(--fs-small);
  font-weight: 400;
}

.start {
  min-height: 60px;
  padding: 14px 32px;
  font-size: 22px;
}

.keys {
  margin: 48px 0 0;
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 12px 48px;
  font-size: var(--fs-small);
}

.keys div {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.keys dt {
  color: var(--ink-2);
}

.keys dd {
  margin: 0;
}

.badge {
  justify-self: end;
  width: 340px;
  padding: 28px 32px 36px;
  background: var(--note);
  transform: rotate(2deg);
  display: grid;
  justify-items: start;
  animation: swing 900ms var(--ease-out) both;
  transform-origin: 50% -40px;
}

.slot {
  justify-self: center;
  width: 72px;
  height: 14px;
  background: var(--paper-deep);
  margin-bottom: 20px;
}

.company {
  font-size: var(--fs-small);
  font-weight: 700;
}

.photo {
  display: block;
  margin: 18px 0 20px;
  width: 140px;
  height: 160px;
  object-fit: cover;
  background: var(--paper);
}

.name {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.role {
  margin-top: 8px;
  font-size: var(--fs-name);
}

.no {
  margin-top: 4px;
  color: var(--ink-2);
}

@keyframes swing {
  from {
    transform: rotate(-4deg) translateY(-16px);
    opacity: 0;
  }
  to {
    transform: rotate(2deg);
    opacity: 1;
  }
}
</style>
