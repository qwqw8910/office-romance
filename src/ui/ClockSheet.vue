<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { tuning } from '../game/tuning'

const game = useGame()
const rows = computed(() => [
  ...game.script.slots.map((s, i) => ({
    time: s.time,
    title: s.title,
    done: i < game.state.slotIndex || (game.state.ending !== null && i <= game.state.slotIndex),
    now: i === game.state.slotIndex && !game.state.ending,
  })),
  {
    time: '18:00',
    title: '下班',
    done: game.state.ending?.kind === 'safe' && game.state.phase === 'ending',
    now: game.state.ending?.kind === 'safe' && game.state.phase !== 'ending',
  },
])
const stamps = computed(() =>
  Array.from({ length: tuning.suspicion.max }, (_, i) => i < game.state.suspicion),
)
</script>

<template>
  <aside class="sheet" aria-label="打卡單">
    <h2>打卡單</h2>
    <ol class="rows">
      <li v-for="r in rows" :key="r.time" :class="{ now: r.now, done: r.done }">
        <span class="time">{{ r.time }}</span>
        <span class="place">{{ r.title }}</span>
        <span class="stamp" :aria-label="r.done ? '已打卡' : r.now ? '進行中' : '未到'">
          {{ r.done ? '到' : '' }}
        </span>
      </li>
    </ol>
    <div class="talks">
      <h3>主管約談</h3>
      <ul :aria-label="`主管約談 ${game.state.suspicion} 次，共 ${stamps.length} 次就出局`">
        <li v-for="(on, i) in stamps" :key="i" :class="{ on }">{{ on ? '約' : '' }}</li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.sheet {
  position: absolute;
  top: 24px;
  right: var(--gutter);
  width: 272px;
  padding: 16px 18px 18px;
  background: var(--paper);
}

h2 {
  font-size: var(--fs-name);
  font-weight: 700;
}

.rows {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

.rows li {
  display: grid;
  grid-template-columns: 52px 1fr 26px;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 6px;
  font-size: 15px;
  color: var(--ink-2);
}

.rows li.now {
  background: var(--note);
  color: var(--ink);
  font-weight: 700;
}

.rows li.done {
  color: var(--ink);
}

.time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.place {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stamp {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--paper);
}

.done .stamp {
  background: var(--ink);
  border-radius: 50%;
  animation: stamp 260ms var(--ease-out) both;
}

.talks {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h3 {
  font-size: 15px;
  font-weight: 700;
}

.talks ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 6px;
}

.talks li {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: var(--panel-deep);
  font-size: 14px;
  font-weight: 700;
}

.talks li.on {
  background: var(--alert);
  color: var(--alert-ink);
  border-radius: 50%;
  animation: stamp 260ms var(--ease-out) both;
}

@keyframes stamp {
  from {
    transform: scale(1.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
