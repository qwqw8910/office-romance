<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { audio } from '../audio/engine'

const game = useGame()
const options = computed(() =>
  game.state.current?.kind === 'choice' ? game.state.current.options : [],
)
const buttons = ref<HTMLButtonElement[]>([])

onMounted(async () => {
  await nextTick()
  buttons.value[0]?.focus()
})

function pick(i: number) {
  audio.sfx.confirm()
  game.choose(i)
}

function move(from: number, dir: number) {
  const n = options.value.length
  buttons.value[(from + dir + n) % n]?.focus()
}
</script>

<template>
  <div class="notes" role="group" aria-label="選項">
    <button
      v-for="(o, i) in options"
      :key="o.text"
      ref="buttons"
      type="button"
      class="note"
      :style="{ '--tilt': `${i % 2 === 0 ? -1.5 : 1.2}deg`, '--delay': `${i * 70}ms` }"
      @click="pick(i)"
      @focus="audio.sfx.select()"
      @mouseenter="audio.sfx.select()"
      @keydown.up.prevent="move(i, -1)"
      @keydown.down.prevent="move(i, 1)"
    >
      <span class="text">
        <span v-if="o.risk" class="risk">大膽</span>
        {{ o.text }}
      </span>
      <kbd aria-hidden="true">{{ i + 1 }}</kbd>
    </button>
  </div>
</template>

<style scoped>
.notes {
  position: absolute;
  left: 72px;
  bottom: 248px;
  width: 520px;
  display: grid;
  gap: 14px;
}

.note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 14px 20px 14px 24px;
  background: var(--note);
  font-size: var(--fs-choice);
  line-height: 1.45;
  text-align: left;
  transform: rotate(var(--tilt));
  animation: stick var(--t-enter) var(--ease-out) var(--delay) both;
  transition:
    transform var(--t-micro) var(--ease-out),
    background-color var(--t-micro) var(--ease-out),
    box-shadow var(--t-micro) var(--ease-out);
}

.note:hover,
.note:focus-visible {
  transform: rotate(0deg) translateY(-4px);
  background: var(--note-2);
  box-shadow: 0 10px 18px rgb(20 22 26 / 0.18);
}

.note:active {
  transform: rotate(0deg) translateY(0);
}

.risk {
  display: inline-block;
  margin-right: 8px;
  padding: 0 8px;
  background: var(--heart);
  color: var(--heart-ink);
  font-size: var(--fs-small);
  font-weight: 700;
  line-height: 1.6;
  vertical-align: 2px;
}

.note kbd {
  flex: none;
  background: rgb(20 22 26 / 0.1);
}

@keyframes stick {
  from {
    opacity: 0;
    transform: rotate(var(--tilt)) translateY(20px);
  }
  to {
    opacity: 1;
    transform: rotate(var(--tilt));
  }
}
</style>
