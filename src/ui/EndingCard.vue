<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { affectionStatus } from '../game/affection'
import { SPEAKER_NAMES } from '../content/day1'
import { tuning } from '../game/tuning'

defineEmits<{ restart: [] }>()
const game = useGame()
const btn = ref<HTMLButtonElement>()
onMounted(() => btn.value?.focus())

const safe = computed(() => game.state.ending?.kind === 'safe')
const winner = computed(() =>
  game.state.ending?.kind === 'safe' ? SPEAKER_NAMES[game.state.ending.lead] : null,
)
const STATUS = { unread: '未讀', read: '已讀', typing: '對方輸入中…' } as const
const leads = computed(() =>
  (['zhou', 'shen'] as const).map((id) => ({
    name: SPEAKER_NAMES[id],
    status: STATUS[affectionStatus(game.state.affection[id])],
  })),
)
const passed = computed(() => game.state.bossLog.filter((b) => b.outcome !== 'caught').length)
</script>

<template>
  <section class="form" aria-labelledby="ending-title">
    <div class="head">
      <p class="kind">簽核單</p>
      <h2 id="ending-title">{{ safe ? '平安下班' : '被約談了' }}</h2>
      <p class="sub">
        {{ safe ? `今天陪你走到電梯口的是${winner}。` : '經理以為你在搞副業，還要你寫企劃。' }}
      </p>
    </div>

    <table>
      <tbody>
        <tr>
          <th scope="row">申請人</th>
          <td>林晏晴（企劃部）</td>
        </tr>
        <tr v-for="l in leads" :key="l.name">
          <th scope="row">{{ l.name }}</th>
          <td>{{ l.status }}</td>
        </tr>
        <tr>
          <th scope="row">躲過主管</th>
          <td>{{ passed }} / {{ game.state.bossLog.length }} 次</td>
        </tr>
        <tr>
          <th scope="row">主管約談</th>
          <td>{{ game.state.suspicion }} / {{ tuning.suspicion.max }} 次</td>
        </tr>
      </tbody>
    </table>

    <button ref="btn" class="btn btn--heart" type="button" @click="$emit('restart')">
      {{ safe ? '明天見，再上一次班' : '明天再試一次' }} <kbd>Enter</kbd>
    </button>

    <span class="stamp" :class="{ safe }" aria-hidden="true">{{ safe ? '核准' : '退件' }}</span>
  </section>
</template>

<style scoped>
.form {
  position: absolute;
  top: 56px;
  left: 50%;
  width: 640px;
  margin-left: -320px;
  padding: 40px 48px 44px;
  background: var(--paper);
  animation: rise 320ms var(--ease-out) both;
}

.kind {
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--ink-2);
}

h2 {
  margin-top: 4px;
  font-size: 64px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.sub {
  margin-top: 14px;
  font-size: 20px;
  line-height: 1.55;
}

table {
  margin-top: 28px;
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-name);
}

th,
td {
  padding: 10px 0;
  border-top: 1px solid var(--panel-deep);
  text-align: left;
}

th {
  width: 9em;
  font-weight: 400;
  color: var(--ink-2);
}

td {
  font-weight: 700;
}

.btn {
  margin-top: 32px;
}

.stamp {
  position: absolute;
  top: 40px;
  right: 44px;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--alert);
  color: var(--alert-ink);
  font-size: 36px;
  font-weight: 700;
  transform: rotate(-14deg);
  animation: stamp 320ms var(--ease-out) 260ms both;
}

.stamp.safe {
  background: var(--heart);
}

@keyframes rise {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes stamp {
  from {
    transform: rotate(-14deg) scale(1.8);
    opacity: 0;
  }
  to {
    transform: rotate(-14deg) scale(1);
    opacity: 1;
  }
}
</style>
