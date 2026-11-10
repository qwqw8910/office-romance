<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()
const btn = ref<HTMLButtonElement>()
onMounted(() => btn.value?.focus())
</script>

<template>
  <section v-if="game.slot" class="intro" aria-labelledby="slot-title">
    <p class="time">{{ game.slot.time }}</p>
    <h2 id="slot-title">{{ game.slot.title }}</h2>
    <button ref="btn" class="btn" type="button" @click="game.advance()">
      打卡進入 <kbd>Enter</kbd>
    </button>
    <span class="stamp" aria-hidden="true">打卡</span>
  </section>
</template>

<style scoped>
.intro {
  position: absolute;
  left: var(--gutter);
  bottom: 24px;
  width: 640px;
  padding: 36px 40px 40px;
  background: var(--paper);
  animation: rise var(--t-enter) var(--ease-out) both;
}

.time {
  font-size: 112px;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

h2 {
  margin-top: 12px;
  font-size: var(--fs-title);
  font-weight: 700;
  line-height: 1.15;
}

.btn {
  margin-top: 28px;
}

.stamp {
  position: absolute;
  top: 36px;
  right: 40px;
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--heart);
  color: var(--heart-ink);
  font-size: 28px;
  font-weight: 700;
  transform: rotate(-12deg);
  animation: stamp 300ms var(--ease-out) 220ms both;
}

@keyframes rise {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes stamp {
  from {
    transform: rotate(-12deg) scale(1.7);
    opacity: 0;
  }
  to {
    transform: rotate(-12deg) scale(1);
    opacity: 1;
  }
}
</style>
