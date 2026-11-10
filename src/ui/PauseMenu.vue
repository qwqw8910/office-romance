<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGame } from '../stores/game'

defineEmits<{ restart: [] }>()
const game = useGame()
const resume = ref<HTMLButtonElement>()
onMounted(() => resume.value?.focus())
</script>

<template>
  <div class="scrim">
    <section class="menu" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title">暫停</h2>
      <label class="toggle">
        <input v-model="game.typewriter" type="checkbox" />
        <span>文字逐字出現</span>
      </label>
      <label class="toggle">
        <input v-model="game.reducedMotion" type="checkbox" />
        <span>減少動態效果（主管小遊戲判定放寬）</span>
      </label>
      <div class="actions">
        <button ref="resume" class="btn" type="button" @click="game.paused = false">
          繼續 <kbd>Esc</kbd>
        </button>
        <button class="btn btn--quiet" type="button" @click="$emit('restart')">回到標題</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: absolute;
  inset: 0;
  background: rgb(20 22 26 / 0.45);
  display: grid;
  place-items: center;
}

.menu {
  width: 520px;
  padding: 32px 36px 36px;
  background: var(--paper);
  box-shadow: 0 18px 40px rgb(20 22 26 / 0.25);
}

h2 {
  font-size: var(--fs-title);
  font-weight: 700;
  margin-bottom: 20px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  font-size: var(--fs-name);
  cursor: pointer;
}

.toggle input {
  width: 22px;
  height: 22px;
  accent-color: var(--heart);
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
