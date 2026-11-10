<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { art } from '../content/expressions'
import { useGame } from '../stores/game'

/** ready：背景與立繪載完了沒；沒載完前按鈕先不能按 */
const props = withDefaults(defineProps<{ ready?: boolean }>(), { ready: true })
defineEmits<{ start: []; continue: [] }>()
const game = useGame()
const startBtn = ref<HTMLButtonElement>()
const continueBtn = ref<HTMLButtonElement>()
const focusFirst = () => (continueBtn.value ?? startBtn.value)?.focus()
onMounted(focusFirst)
watch(
  () => props.ready,
  (ready) => ready && nextTick(focusFirst),
)

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
      <div class="actions">
        <button
          v-if="savedAt"
          ref="continueBtn"
          class="btn btn--heart start"
          type="button"
          :disabled="!ready"
          @click="$emit('continue')"
        >
          繼續上班 <span class="where">{{ savedAt }}</span>
        </button>
        <button
          ref="startBtn"
          class="btn start"
          :class="savedAt ? 'btn--quiet' : 'btn--heart'"
          type="button"
          :disabled="!ready"
          @click="$emit('start')"
        >
          {{ savedAt ? '重新開始' : '開始上班' }} <kbd>Enter</kbd>
        </button>
      </div>
      <p v-if="!ready" class="loading" role="status">載入中…</p>
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
      </dl>
    </div>

    <div class="badge" aria-label="員工識別證">
      <div class="slot" aria-hidden="true"></div>
      <p class="company">日常股份有限公司</p>
      <img class="photo" :src="art.badge()" alt="林晏晴的識別證照片" width="140" height="160" />
      <p class="name">林晏晴</p>
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

.actions {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.start:disabled {
  opacity: 0.55;
  cursor: progress;
}

.loading {
  margin: 12px 0 0;
  font-size: var(--fs-small);
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
