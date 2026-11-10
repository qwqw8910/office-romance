/**
 * 音效與背景音樂引擎。
 * - 音樂與一部分音效用 CC0 音檔（public/audio，來源見 public/audio/CREDITS.md）。
 * - 其餘音效（心跳、逐字點聲、電梯叮、會議通知、蓋章）與所有音樂的備案用 Web Audio 即時合成。
 *   音檔載入失敗時自動退回合成版，遊戲不會變成無聲。
 *
 * 瀏覽器要求使用者先操作一次才能發聲，所以 AudioContext 在 unlock() 時才建立。
 * 沒有 AudioContext 的環境（測試）所有函式都是空操作。
 */

import type { HeartStrength } from '../content/expressions'

export type MusicMode = 'calm' | 'tense' | 'off'

/** 心跳一次的長度與「咚—咚」第二聲的延遲（毫秒）。視覺演出用同一組數字，聲音才對得上畫面 */
export const HEART_PERIOD_MS = 800
export const HEART_DUB_MS = 170

const MUSIC_LEVEL = 0.5
const MUSIC_DUCKED = 0.18
const FADE_S = 0.8

const BASE = import.meta.env.BASE_URL

/** 背景音樂檔。trim 是各曲音量的微調，讓兩首聽起來一樣大聲 */
const MUSIC_FILES: Record<'calm' | 'tense', { url: string; trim: number }> = {
  calm: { url: `${BASE}audio/music/lofi-chill.ogg`, trim: 0.5 },
  tense: { url: `${BASE}audio/music/suspicious-loop.mp3`, trim: 1.4 },
}

/** 音效名稱 → Kenney Interface Sounds 的檔案（CC0）。想換聲音只要改這裡的檔名 */
const SAMPLE_FILES = {
  select: 'select_002',
  confirm: 'confirmation_001',
  stick: 'drop_001',
  cover: 'switch_002',
  success: 'confirmation_003',
  awkward: 'question_001',
  caught: 'error_004',
} as const
type SampleName = keyof typeof SAMPLE_FILES

/** 已解碼的音檔；null 代表載入失敗（用合成版） */
const buffers = new Map<string, AudioBuffer | null>()
const loading = new Map<string, Promise<AudioBuffer | null>>()
let musicSource: AudioBufferSourceNode | null = null
let musicEpoch = 0

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const known = loading.get(url)
  if (known) return known
  const p = (async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(String(res.status))
      const buf = await ctx!.decodeAudioData(await res.arrayBuffer())
      buffers.set(url, buf)
      return buf
    } catch {
      buffers.set(url, null)
      return null
    }
  })()
  loading.set(url, p)
  return p
}

const sampleUrl = (name: SampleName) => `${BASE}audio/sfx/${SAMPLE_FILES[name]}.ogg`

/** 播放短音效；沒載入好就回傳 false，由呼叫端改用合成版 */
function playSample(name: SampleName, t: number, gain = 0.6, rate = 1): boolean {
  const buf = buffers.get(sampleUrl(name))
  if (!ctx || !buf) return false
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = rate
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(g).connect(sfxBus)
  src.start(t)
  return true
}

let ctx: AudioContext | null = null
let musicBus: GainNode
let sfxBus: GainNode
let melodySend: GainNode
let noiseBuf: AudioBuffer
let modeGain: GainNode | null = null

let musicOn = true
let sfxOn = true
let ducked = false
let mode: MusicMode = 'off'
let schedulerId: number | undefined
let nextBarTime = 0
let barIndex = 0

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12)

/** 小型亂數，讓旋律每次重播都一樣，但不是死板的循環 */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ToneOpts {
  type?: OscillatorType
  gain?: number
  attack?: number
  dest?: AudioNode
  slideTo?: number
}

function tone(freq: number, t: number, dur: number, o: ToneOpts = {}) {
  if (!ctx) return
  const { type = 'sine', gain = 0.1, attack = 0.008, dest = sfxBus, slideTo } = o
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(dest)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

interface NoiseOpts {
  gain?: number
  hp?: number
  lp?: number
  dest?: AudioNode
}

function noise(t: number, dur: number, o: NoiseOpts = {}) {
  if (!ctx) return
  const { gain = 0.05, hp = 0, lp = 0, dest = sfxBus } = o
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  let node: AudioNode = src
  if (hp) {
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = hp
    node.connect(f)
    node = f
  }
  if (lp) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = lp
    node.connect(f)
    node = f
  }
  node.connect(g).connect(dest)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

// ── 背景音樂 ─────────────────────────────────────────────

/** 平靜：lo-fi 辦公室。I–vi–ii–V 四小節循環，電鋼琴和弦、輕鼓點、稀疏的鈴音旋律 */
const CALM = {
  beat: 60 / 84,
  chords: [
    { bass: 36, pad: [60, 64, 67, 71] },
    { bass: 33, pad: [57, 60, 64, 67] },
    { bass: 38, pad: [57, 62, 65, 69] },
    { bass: 31, pad: [55, 59, 62, 65] },
  ],
  scale: [72, 74, 76, 79, 81, 84],
}

function calmBar(t: number, bar: number, dest: AudioNode) {
  const beat = CALM.beat
  const barLen = beat * 4
  const chord = CALM.chords[bar % 4]!
  const padFilter = ctx!.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 900
  padFilter.connect(dest)
  for (const m of chord.pad) {
    tone(mtof(m), t, barLen + 0.5, { type: 'triangle', gain: 0.03, attack: 0.35, dest: padFilter })
  }
  // 低音：第 1、3 拍
  tone(mtof(chord.bass), t, beat * 1.6, { gain: 0.16, attack: 0.02, dest })
  tone(mtof(chord.bass), t + beat * 2.5, beat * 1.2, { gain: 0.12, attack: 0.02, dest })
  // 鼓：軟底鼓加切分
  for (const at of [0, 2.5]) {
    tone(110, t + beat * at, 0.16, { gain: 0.14, slideTo: 42, dest })
  }
  for (let i = 0; i < 4; i++) {
    noise(t + beat * (i + 0.5), 0.05, { gain: 0.014, hp: 7000, dest })
  }
  noise(t + beat * 1, 0.1, { gain: 0.02, hp: 1500, lp: 4500, dest })
  noise(t + beat * 3, 0.1, { gain: 0.02, hp: 1500, lp: 4500, dest })
  // 旋律：八分音符上稀疏地落一個音，送進回音
  const rnd = seeded(1000 + (bar % 8))
  for (let i = 0; i < 8; i++) {
    if (rnd() > 0.34) continue
    const m = CALM.scale[Math.floor(rnd() * CALM.scale.length)]!
    const at = t + (barLen / 8) * i
    tone(mtof(m), at, 0.9, { gain: 0.045, attack: 0.012, dest })
    tone(mtof(m), at, 0.9, { gain: 0.03, attack: 0.012, dest: melodySend })
  }
}

/** 緊張：主管巡視。小調低音八分音符脈衝，每拍一個滴答 */
const TENSE = {
  beat: 60 / 118,
  roots: [33, 29, 26, 28],
  stabs: [
    [57, 60, 64],
    [53, 57, 60],
    [50, 53, 57],
    [52, 56, 59],
  ],
}

function tenseBar(t: number, bar: number, dest: AudioNode) {
  const beat = TENSE.beat
  const root = TENSE.roots[bar % 4]!
  const bassFilter = ctx!.createBiquadFilter()
  bassFilter.type = 'lowpass'
  bassFilter.frequency.value = 320
  bassFilter.connect(dest)
  for (let i = 0; i < 8; i++) {
    tone(mtof(root), t + (beat / 2) * i, beat * 0.45, {
      type: 'sawtooth',
      gain: i % 2 === 0 ? 0.1 : 0.06,
      attack: 0.005,
      dest: bassFilter,
    })
  }
  for (const m of TENSE.stabs[bar % 4]!) {
    tone(mtof(m), t, beat * 0.9, { type: 'triangle', gain: 0.04, attack: 0.01, dest })
  }
  for (let i = 0; i < 4; i++) {
    noise(t + beat * i, 0.03, { gain: 0.03, hp: 5000, dest })
  }
  if (bar % 2 === 1) tone(880, t + beat * 3, beat * 0.8, { gain: 0.03, attack: 0.02, dest })
}

function barLength(m: MusicMode): number {
  return (m === 'tense' ? TENSE.beat : CALM.beat) * 4
}

function schedule() {
  if (!ctx || !modeGain || mode === 'off') return
  while (nextBarTime < ctx.currentTime + 1.2) {
    if (mode === 'calm') calmBar(nextBarTime, barIndex, modeGain)
    else tenseBar(nextBarTime, barIndex, modeGain)
    nextBarTime += barLength(mode)
    barIndex += 1
  }
}

function applyMode() {
  if (!ctx) return
  const epoch = ++musicEpoch
  const old = modeGain
  const oldSource = musicSource
  if (old) {
    old.gain.cancelScheduledValues(ctx.currentTime)
    old.gain.setTargetAtTime(0, ctx.currentTime, FADE_S / 3)
    window.setTimeout(
      () => {
        old.disconnect()
        oldSource?.stop()
      },
      FADE_S * 1000 * 2,
    )
    modeGain = null
    musicSource = null
  }
  window.clearInterval(schedulerId)
  if (mode === 'off' || !musicOn) return

  // 優先用音檔；還沒載入好就等它，載入失敗才用合成音樂
  const file = MUSIC_FILES[mode]
  const cached = buffers.get(file.url)
  if (cached === undefined) {
    void loadBuffer(file.url).then(() => {
      if (epoch === musicEpoch) applyMode()
    })
    return
  }
  startMusic(cached, file.trim)
}

function startMusic(buf: AudioBuffer | null, trim: number) {
  if (!ctx) return
  modeGain = ctx.createGain()
  modeGain.gain.value = 0.0001
  modeGain.gain.setTargetAtTime(trim, ctx.currentTime, FADE_S / 3)
  modeGain.connect(musicBus)
  if (buf) {
    musicSource = ctx.createBufferSource()
    musicSource.buffer = buf
    musicSource.loop = true
    musicSource.connect(modeGain)
    musicSource.start()
    return
  }
  nextBarTime = ctx.currentTime + 0.15
  barIndex = 0
  schedule()
  schedulerId = window.setInterval(schedule, 250)
}

function applyLevels() {
  if (!ctx) return
  const level = musicOn ? (ducked ? MUSIC_DUCKED : MUSIC_LEVEL) : 0
  musicBus.gain.setTargetAtTime(level, ctx.currentTime, 0.15)
  sfxBus.gain.setTargetAtTime(sfxOn ? 1 : 0, ctx.currentTime, 0.05)
}

// ── 公開介面 ─────────────────────────────────────────────

/** 在第一次使用者操作時呼叫（瀏覽器的自動播放限制） */
function unlock() {
  if (typeof AudioContext === 'undefined') return
  if (!ctx) {
    ctx = new AudioContext()
    const comp = ctx.createDynamicsCompressor()
    comp.connect(ctx.destination)
    musicBus = ctx.createGain()
    sfxBus = ctx.createGain()
    musicBus.connect(comp)
    sfxBus.connect(comp)
    // 旋律的回音：延遲 0.5 秒、回授 35%、高頻衰減
    const delay = ctx.createDelay(1)
    delay.delayTime.value = CALM.beat * 0.75
    const fb = ctx.createGain()
    fb.gain.value = 0.35
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2600
    melodySend = ctx.createGain()
    melodySend.connect(delay)
    delay.connect(damp).connect(fb).connect(delay)
    damp.connect(musicBus)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    applyLevels()
    applyMode()
    for (const name of Object.keys(SAMPLE_FILES) as SampleName[]) void loadBuffer(sampleUrl(name))
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function setMode(next: MusicMode) {
  if (next === mode) return
  mode = next
  applyMode()
}

function setMusicEnabled(on: boolean) {
  if (on === musicOn) return
  musicOn = on
  applyLevels()
  applyMode()
}

function setSfxEnabled(on: boolean) {
  sfxOn = on
  applyLevels()
}

/** 暫停選單開著時把音樂壓低，說話時聽得清楚 */
function setDucked(on: boolean) {
  ducked = on
  applyLevels()
}

/** 可以放音效的時間點；沒解鎖或關閉時回傳 null */
function now(): number | null {
  if (!ctx || !sfxOn || ctx.state !== 'running') return null
  return ctx.currentTime
}

function thump(t: number, amp: number) {
  tone(96, t, 0.2, { gain: 0.5 * amp, attack: 0.004, slideTo: 46 })
  tone(192, t, 0.1, { type: 'triangle', gain: 0.12 * amp, attack: 0.004, slideTo: 92 })
}

const sfx = {
  /** 逐字出現的輕點聲，pitch 依說話的人不同 */
  tick(pitch: number) {
    const t = now()
    if (t === null) return
    tone(pitch * (0.97 + Math.random() * 0.06), t, 0.05, { type: 'triangle', gain: 0.022 })
  },
  /** 選項被聚焦：紙張輕碰 */
  select() {
    const t = now()
    if (t === null || playSample('select', t, 0.35)) return
    noise(t, 0.045, { gain: 0.05, hp: 2200, lp: 6000 })
  },
  /** 選項出現：便利貼一張張貼上 */
  stick(count: number) {
    const t = now()
    if (t === null) return
    for (let i = 0; i < count; i++) {
      // 每張音高略升，聽起來像一張接一張貼上去
      if (!playSample('stick', t + i * 0.09, 0.5, 1 + i * 0.1)) {
        noise(t + i * 0.07, 0.07, { gain: 0.06, hp: 900, lp: 3200 })
      }
    }
  },
  /** 確定選項 */
  confirm() {
    const t = now()
    if (t === null || playSample('confirm', t, 0.55)) return
    noise(t, 0.08, { gain: 0.06, hp: 1200, lp: 4000 })
    tone(660, t, 0.18, { gain: 0.07 })
    tone(880, t + 0.07, 0.24, { gain: 0.06 })
  },
  /** 心跳：「咚—咚」，每一下配一個很輕的閃爍音，對上畫面的愛心 */
  heartbeat(strength: HeartStrength) {
    const t = now()
    if (t === null) return
    const beats = strength === 'strong' ? 3 : 2
    const amp = strength === 'strong' ? 1 : 0.7
    for (let k = 0; k < beats; k++) {
      const at = t + (k * HEART_PERIOD_MS) / 1000
      const fade = 1 - k * 0.18
      thump(at, amp * fade)
      thump(at + HEART_DUB_MS / 1000, amp * 0.72 * fade)
    }
    tone(1568, t + 0.02, 0.6, { gain: 0.03, attack: 0.01 })
    tone(2093, t + 0.1, 0.7, { gain: 0.022, attack: 0.01 })
  },
  /** 時段開始：電梯「叮」 */
  ding() {
    const t = now()
    if (t === null) return
    tone(1175, t, 1.3, { gain: 0.09, attack: 0.004 })
    tone(2350, t, 0.5, { gain: 0.02, attack: 0.004 })
  },
  /** 會議邀請彈出：兩音通知聲加一下低脈衝 */
  bossAlert() {
    const t = now()
    if (t === null) return
    tone(784, t, 0.32, { gain: 0.1 })
    tone(1047, t + 0.14, 0.5, { gain: 0.1 })
    tone(60, t, 0.3, { gain: 0.25, attack: 0.01 })
  },
  /** 按下掩護 */
  cover() {
    const t = now()
    if (t === null || playSample('cover', t, 0.55)) return
    noise(t, 0.12, { gain: 0.07, hp: 600, lp: 2600 })
    tone(420, t, 0.1, { type: 'triangle', gain: 0.06, slideTo: 300 })
  },
  success() {
    const t = now()
    if (t === null || playSample('success', t, 0.6)) return
    for (const [i, m] of [72, 76, 79, 84].entries()) {
      tone(mtof(m), t + i * 0.08, 0.55, { gain: 0.07 })
    }
  },
  awkward() {
    const t = now()
    if (t === null || playSample('awkward', t, 0.55)) return
    tone(mtof(72), t, 0.35, { gain: 0.07 })
    tone(mtof(68), t + 0.16, 0.5, { gain: 0.07 })
  },
  caught() {
    const t = now()
    if (t === null) return
    // 音檔疊在合成的下沉低音上，被抓的感覺比較重
    playSample('caught', t, 0.5)
    tone(220, t, 0.5, { type: 'sawtooth', gain: 0.1, slideTo: 90 })
    tone(147, t + 0.05, 0.5, { type: 'sawtooth', gain: 0.08, slideTo: 60 })
  },
  /** 結局蓋章 */
  stamp() {
    const t = now()
    if (t === null) return
    thump(t, 1.1)
    noise(t, 0.12, { gain: 0.1, lp: 1500 })
  },
}

export const audio = { unlock, setMode, setMusicEnabled, setSfxEnabled, setDucked, sfx }
