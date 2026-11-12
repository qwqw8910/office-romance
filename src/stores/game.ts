import { defineStore } from 'pinia'
import { computed, markRaw, nextTick, reactive, ref, shallowRef, watch } from 'vue'
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
import {
  browserStore,
  clearSave,
  isSaveable,
  readSave,
  readSettings,
  writeSave,
  writeSettings,
  type SaveData,
} from '../game/save'
import { tuning } from '../game/tuning'
import type { BossEvent, BossOutcome, CoverId, LeadId, Line } from '../game/types'
import { day1 } from '../content/day1'
import { DEFAULT_PLAYER_NAME, personalize, sanitizeName } from '../game/personalize'
import {
  expressionFor,
  heartbeatFor,
  jiaExpressionFor,
  type Expression,
  type HeartStrength,
} from '../content/expressions'
import { bus, type BossFrame } from '../bus'
import { evaluate, readAchievements, unlock, type AchievementId } from '../game/achievements'

export type BossStage = 'idle' | 'brief' | 'running' | 'result'

const RESULT_HOLD_MS = 1400
const CHAR_INTERVAL_MS = 28

export const useGame = defineStore('game', () => {
  const params = new URLSearchParams(window.location.search)
  const debug = params.has('debug')
  const seed = Number(params.get('seed') ?? Math.floor(Math.random() * 1e6))
  const startSlot = Number(params.get('slot') ?? 0)

  const baseScript = day1
  const savedName = readSettings(browserStore()).playerName
  const playerName = ref(sanitizeName(savedName ?? DEFAULT_PLAYER_NAME))
  const script = shallowRef(personalize(baseScript, playerName.value))
  function setPlayerName(raw: string) {
    playerName.value = sanitizeName(raw)
    script.value = personalize(baseScript, playerName.value)
  }
  const state = reactive(createState())
  let rng = createRng(seed)

  // ── 設定（存在 localStorage，下次開啟沿用） ──────────────
  const store = browserStore()
  const savedSettings = readSettings(store)
  const reducedMotion = ref(
    savedSettings.reducedMotion ??
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false,
  )
  const typewriter = ref(savedSettings.typewriter ?? !reducedMotion.value)
  const music = ref(savedSettings.music ?? true)
  const sfx = ref(savedSettings.sfx ?? true)
  const paused = ref(false)
  watch([typewriter, reducedMotion, music, sfx, playerName], ([t, r, m, s, n]) =>
    writeSettings(store, { typewriter: t, reducedMotion: r, music: m, sfx: s, playerName: n }),
  )

  // ── 心動演出 ─────────────────────────────────────────
  /** 男角說出臉紅類台詞時更新；id 每次遞增，讓畫面與音效能各自重播 */
  const heartPulse = ref<{ id: number; lead: LeadId; strength: HeartStrength } | null>(null)
  let pulseId = 0

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
  /** 主管目前的表情：他說話時依 mood 更新 */
  const jiaExpression = computed<Expression>(() =>
    line.value?.speaker === 'jia' ? jiaExpressionFor(line.value.mood) : 'normal',
  )
  /** 場上男角目前的表情：他說話時依 mood 更新，旁白與內心獨白時維持 */
  const expression = ref<Expression>('normal')
  /** 目前說話的人，用來讓沒說話的角色變暗 */
  const speaker = computed(() => line.value?.speaker ?? null)

  watch(
    () => state.current,
    (beat) => {
      if (beat?.kind === 'line') {
        lastLine.value = beat
        if (beat.speaker === 'zhou' || beat.speaker === 'shen') {
          if (onStage.value !== beat.speaker) expression.value = 'normal'
          onStage.value = beat.speaker
          expression.value = expressionFor(beat.mood)
          const strength = heartbeatFor(beat.mood)
          if (strength) heartPulse.value = { id: ++pulseId, lead: beat.speaker, strength }
        }
        startTyping()
      }
      if (beat?.kind === 'boss') openBoss(beat)
    },
  )
  watch(
    () => state.slotIndex,
    () => {
      onStage.value = null
      expression.value = 'normal'
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
  /** 這次主管事件開始時的熱度（大膽選項累積），給提示文字用 */
  const bossHeat = ref(0)

  function openBoss(event: BossEvent) {
    bossHeat.value = state.heat
    timeline.value = markRaw(
      buildTimeline(event.pattern, rng, {
        leniency: reducedMotion.value ? tuning.reducedMotionLeniency : 1,
        heat: state.heat,
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
      resolveBoss(state, script.value, outcome)
    }, RESULT_HOLD_MS)
  }

  // ── 成就 ─────────────────────────────────────────────
  const achievements = ref<AchievementId[]>(readAchievements(store))
  /** 這一輪結局才第一次解鎖的成就 */
  const freshAchievements = ref<AchievementId[]>([])
  watch(
    () => state.phase,
    (phase) => {
      if (phase !== 'ending') return
      const { all, fresh } = unlock(store, evaluate(state))
      achievements.value = all
      freshAchievements.value = fresh
    },
  )

  // ── 存檔 ─────────────────────────────────────────────
  /** 標題畫面用：目前可以續玩的存檔 */
  const savedGame = shallowRef<SaveData | null>(readSave(store, baseScript))

  watch(
    [() => state, onStage, expression, lastLine],
    () => {
      if (state.phase === 'ending') clearSave(store)
      else if (isSaveable(state)) {
        writeSave(
          store,
          baseScript,
          state,
          {
            onStage: onStage.value,
            expression: expression.value,
            lastLine: lastLine.value,
          },
          playerName.value,
        )
      }
    },
    { deep: true },
  )

  async function continueGame() {
    const data = readSave(store, baseScript)
    if (!data) {
      savedGame.value = null
      return
    }
    rng = createRng(seed)
    setPlayerName(data.playerName ?? DEFAULT_PLAYER_NAME)
    Object.assign(state, data.state)
    // 等時段切換的 watcher 重設完場上角色，再套回存檔時的畫面
    await nextTick()
    onStage.value = data.view.onStage
    expression.value = data.view.expression as Expression
    if (data.view.lastLine) lastLine.value = data.view.lastLine
  }

  // ── 流程 ─────────────────────────────────────────────
  function start(name?: string) {
    if (name !== undefined) setPlayerName(name)
    rng = createRng(seed)
    if (startSlot > 0) jumpToSlot(state, script.value, startSlot)
    else startGame(state, script.value)
  }

  function advance() {
    if (paused.value) return
    if (state.phase === 'line' && !lineComplete.value) {
      window.clearInterval(typeTimer)
      lineProgress.value = line.value?.text.length ?? 0
      return
    }
    if (state.phase === 'line' || state.phase === 'slotIntro') next(state, script.value)
  }

  function choose(index: number) {
    if (!paused.value) chooseOption(state, script.value, index)
  }

  function restart() {
    paused.value = false
    bossStage.value = 'idle'
    timeline.value = null
    lastLine.value = null
    expression.value = 'normal'
    onStage.value = null
    heartPulse.value = null
    freshAchievements.value = []
    Object.assign(state, createState())
    savedGame.value = readSave(store, baseScript)
  }

  const slot = computed(() => currentSlot(state, script.value))

  return {
    script,
    playerName,
    setPlayerName,
    state,
    debug,
    seed,
    reducedMotion,
    typewriter,
    music,
    sfx,
    heartPulse,
    paused,
    line,
    lastLine,
    lineProgress,
    lineComplete,
    onStage,
    jiaOnStage,
    jiaExpression,
    expression,
    speaker,
    slot,
    bossStage,
    bossEvent,
    timeline,
    selectedCover,
    frame,
    bossResult,
    seenHints,
    bossHeat,
    achievements,
    freshAchievements,
    savedGame,
    start,
    continueGame,
    advance,
    choose,
    startBoss,
    pressCover,
    selectCover,
    finishBoss,
    restart,
  }
})
