import { Container, Graphics, Text, Ticker } from 'pixi.js'
import {
  canSee,
  coverStateAt,
  judge,
  poseAt,
  type BossTimeline,
  type CoverPress,
} from '../game/boss'
import type { CoverId, LeadId } from '../game/types'
import { bus } from '../bus'
import { C, FONT } from './palette'

const W = 1280
const H = 720
const LANE_Y = 296
const SEAT_Y = 206

const COVER_LABEL: Record<CoverId, string> = {
  phone: '講電話中',
  copy: '影印中',
  pen: '撿筆中',
}

const PROP_LABEL: Record<CoverId, string> = {
  phone: '電話',
  copy: '影印機',
  pen: '會議桌',
}

function token(fill: number, label: string, r = 30): Container {
  const c = new Container()
  const g = new Graphics().circle(0, 0, r).fill(fill)
  const t = new Text({
    text: label,
    style: { fontFamily: FONT, fontSize: r * 0.9, fontWeight: '700', fill: C.paper },
  })
  t.anchor.set(0.5)
  c.addChild(g, t)
  return c
}

/**
 * 「預判主管」俯視小遊戲。只負責畫面與時鐘，判定交給 game/boss.ts。
 * 輸入來自 bus 的 cover:press；每一幀送出 boss:frame，結束送出 boss:done。
 */
export class BossMinigame {
  readonly root = new Container()
  private floor = new Graphics()
  private path = new Graphics()
  private prop = new Container()
  private cone = new Graphics()
  private ring = new Graphics()
  private heroine = token(C.ink, '晴', 32)
  private lead = token(C.zhou, '澄')
  private boss = token(C.jia, '賈', 36)
  private coverText = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 20, fontWeight: '700', fill: C.ink },
  })

  private timeline: BossTimeline | null = null
  private sceneCover: CoverId = 'phone'
  private presses: CoverPress[] = []
  private t = 0
  private running = false
  private shake = 0
  paused = false
  reducedMotion = false

  constructor(ticker: Ticker) {
    this.root.visible = false
    this.coverText.anchor.set(0.5, 1)
    this.root.addChild(
      this.floor,
      this.path,
      this.prop,
      this.cone,
      this.lead,
      this.heroine,
      this.ring,
      this.coverText,
      this.boss,
    )
    this.drawFloor()
    bus.on('cover:press', (cover) => {
      if (!this.running || this.paused) return
      this.presses.push({ t: this.t, cover })
    })
    ticker.add(this.tick)
  }

  private drawFloor() {
    const g = this.floor
    g.rect(0, 0, W, H).fill(C.floor)
    // 上下兩排座位
    for (let i = 0; i < 6; i++) {
      g.rect(30 + i * 214, 24, 180, 124).fill(C.deskTop)
      g.rect(30 + i * 214, 404, 180, 150).fill(C.deskTop)
    }
    // 走道
    g.rect(0, 230, W, 132).fill(C.panel)
    // 女主座位
    g.rect(740, 134, 160, 92).fill(C.memo)
  }

  /** 進入小遊戲：顯示場景，等待 run() */
  prepare(timeline: BossTimeline, sceneCover: CoverId, lead: LeadId) {
    this.timeline = timeline
    this.sceneCover = sceneCover
    this.presses = []
    this.t = 0
    this.running = false
    this.root.visible = true

    const hx = timeline.heroineX
    this.heroine.position.set(hx, SEAT_Y)
    this.lead.position.set(hx - 76, SEAT_Y + 6)
    ;(this.lead.children[0] as Graphics)
      .clear()
      .circle(0, 0, 30)
      .fill(lead === 'zhou' ? C.zhou : C.shen)
    ;(this.lead.children[1] as Text).text = lead === 'zhou' ? '澄' : '硯'
    this.drawProp(hx)

    // 巡邏模式把路線畫在地上
    this.path.clear()
    if (timeline.pattern === 'patrol') {
      for (let x = 20; x < W; x += 44) this.path.circle(x, LANE_Y, 5).fill(C.desk)
    }
    this.renderAt(0)
  }

  private drawProp(hx: number) {
    this.prop.removeChildren()
    const g = new Graphics()
    const x = hx + 70
    if (this.sceneCover === 'phone') g.roundRect(x, 158, 64, 34, 6).fill(C.dark)
    if (this.sceneCover === 'copy') g.rect(x, 140, 90, 72).fill(C.metal)
    if (this.sceneCover === 'pen') g.rect(x - 40, 144, 150, 64).fill(C.wood)
    const label = new Text({
      text: PROP_LABEL[this.sceneCover],
      style: { fontFamily: FONT, fontSize: 18, fill: C.ink },
    })
    label.position.set(x, 112)
    this.prop.addChild(g, label)
  }

  run() {
    if (this.timeline) this.running = true
  }

  hide() {
    this.running = false
    this.root.visible = false
    this.root.position.set(0, 0)
  }

  private tick = (ticker: Ticker) => {
    if (this.shake > 0) {
      this.shake -= ticker.deltaMS
      this.root.position.set(this.shake > 0 ? Math.sin(this.shake / 12) * 3 : 0, 0)
    }
    if (!this.running || this.paused || !this.timeline) return
    this.t += ticker.deltaMS / 1000
    const tl = this.timeline
    const result = judge(tl, this.presses, this.sceneCover, Math.min(this.t, tl.duration))
    this.renderAt(this.t)
    if (result !== 'pending') {
      this.running = false
      if (result === 'caught' && !this.reducedMotion) this.shake = 140
      bus.emit('boss:done', { outcome: result, presses: [...this.presses] })
    }
  }

  private renderAt(t: number) {
    const tl = this.timeline
    if (!tl) return
    // 減少動態效果：主管一格一格移動
    const shown = this.reducedMotion ? Math.floor(t / 0.25) * 0.25 : t
    const { x, facing } = poseAt(tl, shown)
    this.boss.position.set(x, LANE_Y)

    const seen = canSee(tl, t)
    const cover = coverStateAt(tl, this.presses, t)
    const covering = cover.state === 'covering'

    // 視線扇形：平塗半透明
    this.cone.clear()
    const reach = tl.sightRange
    this.cone
      .poly([x, LANE_Y, x + facing * reach, LANE_Y - 120, x + facing * reach, LANE_Y + 40])
      .fill({ color: seen ? C.alert : C.jia, alpha: seen ? 0.32 : 0.16 })

    // 掩護狀態：計時環與文字
    this.ring.clear()
    const hx = tl.heroineX
    if (cover.state !== 'idle') {
      const total = covering ? tl.coverDuration : tl.coverCooldown
      const frac = Math.max(0, Math.min(1, cover.remaining / total))
      this.ring
        .arc(hx, SEAT_Y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac)
        .stroke({ width: 6, color: covering ? C.heart : C.ink2 })
    }
    this.coverText.position.set(hx, SEAT_Y - 52)
    this.coverText.text = covering && cover.cover ? COVER_LABEL[cover.cover] : ''
    this.heroine.alpha = covering ? 0.55 : 1
    this.lead.alpha = covering ? 0.55 : 1

    const cue = [...tl.cues].reverse().find((c) => c.t <= t && t - c.t < 1.6)
    const speech = [...tl.speech].reverse().find((s) => s.t <= t && t - s.t < 1.4)
    bus.emit('boss:frame', {
      t,
      cue: cue?.text ?? null,
      speech: speech?.text ?? null,
      cover,
      seen,
    })
  }
}
