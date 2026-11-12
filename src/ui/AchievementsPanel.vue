<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { ACHIEVEMENTS } from '../game/achievements'
import { art, type CgId } from '../content/expressions'

defineEmits<{ close: [] }>()
const game = useGame()
const closeBtn = ref<HTMLButtonElement>()
onMounted(() => closeBtn.value?.focus())

const rows = computed(() =>
  ACHIEVEMENTS.map((a) => {
    const unlocked = game.achievements.includes(a.id)
    const masked = a.hidden && !unlocked
    return {
      id: a.id,
      unlocked,
      title: masked ? '？？？' : a.title,
      description: unlocked ? a.description : masked ? '隱藏成就' : '尚未達成',
      cg: unlocked ? a.cg : undefined,
    }
  }),
)
const count = computed(() => rows.value.filter((r) => r.unlocked).length)

/** 正在全畫面回想的 CG */
const viewing = ref<CgId | null>(null)
const viewer = ref<HTMLButtonElement>()
function open(id: CgId) {
  viewing.value = id
  requestAnimationFrame(() => viewer.value?.focus())
}
</script>

<template>
  <div class="scrim">
    <section class="panel" role="dialog" aria-modal="true" aria-labelledby="ach-title">
      <div class="head">
        <h2 id="ach-title">成就</h2>
        <p class="count">{{ count }} / {{ rows.length }}</p>
      </div>
      <ul>
        <li v-for="r in rows" :key="r.id" :class="{ locked: !r.unlocked }">
          <span class="mark" aria-hidden="true">{{ r.unlocked ? '核准' : '待簽' }}</span>
          <div class="text">
            <p class="name">{{ r.title }}</p>
            <p class="desc">{{ r.description }}</p>
          </div>
          <button
            v-if="r.cg"
            class="thumb"
            type="button"
            :aria-label="`回想 ${r.title} 的結局畫面`"
            @click="open(r.cg)"
          >
            <img :src="art.cg(r.cg)" alt="" width="112" height="63" />
          </button>
        </li>
      </ul>
      <button ref="closeBtn" class="btn" type="button" @click="$emit('close')">
        關閉 <kbd>Esc</kbd>
      </button>
    </section>

    <button
      v-if="viewing"
      ref="viewer"
      class="viewer"
      type="button"
      aria-label="關閉結局畫面"
      @click="viewing = null"
      @keydown.esc.stop.prevent="viewing = null"
    >
      <img :src="art.cg(viewing)" alt="結局畫面" />
    </button>
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

.panel {
  width: 900px;
  max-height: 660px;
  overflow-y: auto;
  padding: 32px 36px 36px;
  background: var(--paper);
  box-shadow: 0 18px 40px rgb(20 22 26 / 0.25);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

h2 {
  font-size: var(--fs-title);
  font-weight: 700;
}

.count {
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--ink-2);
}

ul {
  list-style: none;
  margin: 20px 0 24px;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

li {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 76px;
  padding: 10px 14px;
  background: var(--panel);
}

.mark {
  flex: none;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--heart);
  color: var(--heart-ink);
  font-size: 15px;
  font-weight: 700;
  transform: rotate(-10deg);
}

.locked .mark {
  background: var(--panel-deep);
  color: var(--ink-2);
  transform: none;
}

.text {
  flex: 1;
}

.name {
  font-size: var(--fs-name);
  font-weight: 700;
}

.desc {
  font-size: var(--fs-small);
  color: var(--ink-2);
}

.locked .name {
  color: var(--ink-2);
}

.thumb {
  flex: none;
  min-width: 44px;
  min-height: 44px;
}

.thumb img {
  display: block;
  object-fit: cover;
}

.viewer {
  position: absolute;
  inset: 0;
  background: var(--ink);
  cursor: zoom-out;
}

.viewer img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
