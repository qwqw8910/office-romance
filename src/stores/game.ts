import { defineStore } from 'pinia'
import { computed, markRaw, reactive, ref, shallowRef, watch } from 'vue'
import {
  choose as chooseOption,
  createState,
  currentSlot,
  jumpToSlot,
  next,
  resolveBoss,
  startGame,
} from '../game/director'
import { buildTimeline, type BossTimeline } from '../game/boss'
import { createRng } from '../game/rng'
import { tuning } from '../game/tuning'
import type { BossEvent, BossOutcome, CoverId, LeadId, Line } from '../game/types'
import { day1 } from '../content/day1'
import { bus, type BossFrame } from '../bus'

export type BossStage = 'idle' | 'brief' | 'running' | 'result'

const RESULT_HOLD_MS = 1400
const CHAR_INTERVAL_MS = 28

export const useGame = defineStore('game', () => {
  const params = new URLSearchParams(window.location.search)
  const debug = params.has('debug')
  const seed = Number(params.get('seed') ?? Math.floor(Math.random() * 1e6))
  const startSlot = Number(params.get('slot') ?? 0)

  const script = day1
  const state = reactive(createState())
  let rng = createRng(seed)

  // ── 設定 ─────────────────────────────────────────────
  const reducedMotion = ref(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  const typewriter = ref(!reducedMotion.value)
  const paused = ref(false)

  // ── 對話 ─────────────────────────────────────────────
  const line = computed<Line | null>(() => (state.current?.kind === 'line' ? state.current : null))
  const lineProgress = ref(0)
  const lineComplete = computed(() => !line.value || lineProgress.value >= line.value.text.length)
  let typeTimer: number | undefined

  function startTyping() {
    window.clearInterval(typeTimer)
    lineProgress.value = 0
    if (!line.value) return
    if (!typewriter.value) {
      lineProgress.value = line.value.text.length
      return
    }
    typeTimer = window.setInterval(() => {
      if (paused.value) return
      lineProgress.value += 1
      if (lineComplete.value) window.clearInterval(typeTimer)
    }, CHAR_INTERVAL_MS)
  }

  /** 目前場景中站著的男角：最近一位說話的男角，或時段的主角 */
  const onStage = ref<LeadId | null>(null)
  /** 選項出現時，對話框保留上一句 */
  const lastLine = ref<Line | null>(null)
  const jiaOnStage = computed(() => line.value?.speaker === 'jia')

  watch(
    () => state.current,
    (beat) => {
      if (beat?.kind === 'line') {
        lastLine.value = beat
        if (beat.speaker === 'zhou' || beat.speaker === 'shen') onStage.value = beat.speaker
        startTyping()
      }
      if (beat?.kind === 'boss') openBoss(beat)
    },
  )
  watch(
    () => state.slotIndex,
    () => {
      onStage.value = null
    },
  )

  // ── 主管小遊戲 ─────────────────────────────────────────
  const bossStage = ref<BossStage>('idle')
  const timeline = shallowRef<BossTimeline | null>(null)
  const selectedCover = ref<CoverId>('phone')
  const frame = ref<BossFrame | null>(null)
  const bossResult = ref<BossOutcome | null>(null)
  const bossEvent = computed<BossEvent | null>(() =>
    state.current?.kind === 'boss' ? state.current : null,
  )
  const seenHints = reactive(new Set<string>())

  function openBoss(event: BossEvent) {
    timeline.value = markRaw(
      buildTimeline(event.pattern, rng, {
        leniency: reducedMotion.value ? tuning.reducedMotionLeniency : 1,
      }),
    )
    onStage.value = event.lead
    frame.value = null
    bossResult.value = null
    bossStage.value = 'brief'
  }

  function startBoss() {
    if (bossStage.value !== 'brief' || !bossEvent.value) return
    if (bossEvent.value.hint) seenHints.add(bossEvent.value.hint)
    bossStage.value = 'running'
  }

  function pressCover() {
    if (bossStage.value === 'running' && !paused.value) bus.emit('cover:press', selectedCover.value)
  }

  function selectCover(cover: CoverId) {
    selectedCover.value = cover
  }

  bus.on('boss:frame', (f) => {
    frame.value = f
  })
  bus.on('boss:done', ({ outcome }) => finishBoss(outcome))

  function finishBoss(outcome: BossOutcome) {
    if (bossStage.value !== 'running' && bossStage.value !== 'brief') return
    bossResult.value = outcome
    bossStage.value = 'result'
    window.setTimeout(() => {
      bossStage.value = 'idle'
      timeline.value = null
      resolveBoss(state, script, outcome)
    }, RESULT_HOLD_MS)
  }

  // ── 流程 ─────────────────────────────────────────────
  function start() {
    rng = createRng(seed)
    if (startSlot > 0) jumpToSlot(state, script, startSlot)
    else startGame(state, script)
  }

  function advance() {
    if (paused.value) return
    if (state.phase === 'line' && !lineComplete.value) {
      window.clearInterval(typeTimer)
      lineProgress.value = line.value?.text.length ?? 0
      return
    }
    if (state.phase === 'line' || state.phase === 'slotIntro') next(state, script)
  }

  function choose(index: number) {
    if (!paused.value) chooseOption(state, script, index)
  }

  function restart() {
    paused.value = false
    bossStage.value = 'idle'
    timeline.value = null
    lastLine.value = null
    onStage.value = null
    Object.assign(state, createState())
  }

  const slot = computed(() => currentSlot(state, script))

  return {
    script,
    state,
    debug,
    seed,
    reducedMotion,
    typewriter,
    paused,
    line,
    lastLine,
    lineProgress,
    lineComplete,
    onStage,
    jiaOnStage,
    slot,
    bossStage,
    bossEvent,
    timeline,
    selectedCover,
    frame,
    bossResult,
    seenHints,
    start,
    advance,
    choose,
    startBoss,
    pressCover,
    selectCover,
    finishBoss,
    restart,
  }
})
