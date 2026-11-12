import { Container, Graphics, Sprite, Ticker, type Texture } from 'pixi.js'
import type { LeadId, LocationId } from '../game/types'
import type { CgId, Expression } from '../content/expressions'
import { C } from './palette'
import { HEART_DUB_MS, HEART_PERIOD_MS } from '../audio/engine'

const W = 1280
const H = 720

/** 各場景的平面背景（佔位美術）。只用色塊。 */
function drawLocation(g: Graphics, loc: LocationId) {
  g.clear()
  switch (loc) {
    case 'desk': {
      g.rect(0, 0, W, H).fill(C.wall)
      // 窗戶
      for (let i = 0; i < 4; i++) g.rect(80 + i * 300, 70, 240, 200).fill(C.glass)
      g.rect(0, 470, W, H - 470).fill(C.floor)
      // 隔板與桌子
      g.rect(0, 380, W, 26).fill(C.wallDeep)
      g.rect(0, 406, W, 70).fill(C.deskTop)
      g.rect(0, 476, W, 18).fill(C.desk)
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 260
        g.rect(x, 300, 150, 100).fill(C.screen)
        g.rect(x + 65, 400, 20, 10).fill(C.metal)
      }
      // 電話
      g.roundRect(1080, 384, 110, 30, 6).fill(C.dark)
      g.rect(1090, 372, 90, 14).fill(C.ink)
      break
    }
    case 'pantry': {
      g.rect(0, 0, W, H).fill(C.memo)
      g.rect(0, 0, W, 40).fill(C.wallDeep)
      // 上櫃
      g.rect(60, 80, 720, 150).fill(C.paper)
      for (let i = 0; i < 4; i++) g.rect(70 + i * 180, 90, 160, 130).fill(C.wall)
      // 吧台
      g.rect(0, 420, W, 300).fill(C.wood)
      g.rect(0, 420, W, 30).fill(C.woodDeep)
      // 咖啡機
      g.rect(140, 260, 170, 160).fill(C.dark)
      g.rect(170, 290, 110, 50).fill(C.screen)
      g.rect(205, 360, 40, 40).fill(C.metal)
      // 冰箱
      g.rect(1000, 90, 220, 330).fill(C.paper)
      g.rect(1010, 100, 200, 140).fill(C.wall)
      g.rect(1010, 250, 200, 160).fill(C.wall)
      // 電話掛在牆上
      g.roundRect(880, 220, 70, 120, 8).fill(C.dark)
      break
    }
    case 'rooftop': {
      g.rect(0, 0, W, H).fill(C.sky)
      g.ellipse(260, 120, 140, 36).fill(C.cloud)
      g.ellipse(980, 90, 180, 40).fill(C.cloud)
      // 遠方樓群
      const towers = [60, 150, 90, 200, 120, 170, 80, 140, 110, 190]
      towers.forEach((h, i) => g.rect(i * 130, 360 - h, 110, h + 40).fill(C.wallDeep))
      g.rect(0, 400, W, H - 400).fill(C.floor)
      // 欄杆
      g.rect(0, 360, W, 14).fill(C.metal)
      for (let x = 20; x < W; x += 60) g.rect(x, 360, 10, 60).fill(C.metal)
      // 長椅
      g.rect(240, 520, 420, 26).fill(C.wood)
      g.rect(260, 546, 20, 60).fill(C.woodDeep)
      g.rect(620, 546, 20, 60).fill(C.woodDeep)
      // 盆栽
      g.rect(1060, 500, 120, 110).fill(C.woodDeep)
      g.circle(1120, 470, 70).fill(C.plant)
      g.circle(1080, 440, 40).fill(C.plantDeep)
      break
    }
    case 'copyroom': {
      g.rect(0, 0, W, H).fill(C.wall)
      // 紙架
      for (let r = 0; r < 4; r++) {
        g.rect(60, 90 + r * 90, 360, 14).fill(C.metal)
        for (let k = 0; k < 6; k++) g.rect(70 + k * 58, 50 + r * 90, 48, 40).fill(C.paper)
      }
      g.rect(0, 480, W, H - 480).fill(C.floor)
      // 大台影印機
      g.rect(860, 240, 340, 280).fill(C.panel)
      g.rect(860, 240, 340, 40).fill(C.metal)
      g.rect(890, 300, 140, 40).fill(C.screen)
      g.rect(880, 380, 300, 26).fill(C.wallDeep)
      g.rect(880, 420, 300, 26).fill(C.wallDeep)
      // 卡住的紙
      g.rect(1040, 296, 120, 20).fill(C.paper)
      break
    }
    case 'meeting': {
      g.rect(0, 0, W, H).fill(C.wallDeep)
      // 百葉窗
      g.rect(760, 60, 460, 300).fill(C.glass)
      for (let y = 70; y < 360; y += 22) g.rect(760, y, 460, 8).fill(C.wall)
      // 白板
      g.rect(80, 70, 560, 280).fill(C.paper)
      g.rect(80, 350, 560, 12).fill(C.metal)
      for (let i = 0; i < 6; i++) g.rect(120, 110 + i * 36, 200 + ((i * 97) % 260), 10).fill(C.memo)
      g.rect(0, 470, W, H - 470).fill(C.floorDeep)
      // 長會議桌
      g.rect(80, 450, 1120, 60).fill(C.wood)
      g.rect(80, 510, 1120, 18).fill(C.woodDeep)
      break
    }
    case 'elevator': {
      g.rect(0, 0, W, H).fill(C.wall)
      g.rect(380, 60, 520, 600).fill(C.metal)
      g.rect(400, 80, 236, 580).fill(C.panel)
      g.rect(644, 80, 236, 580).fill(C.panel)
      g.rect(930, 300, 60, 120).fill(C.dark)
      g.circle(960, 335, 12).fill(C.note)
      g.circle(960, 385, 12).fill(C.paper)
      g.rect(0, 640, W, 80).fill(C.floor)
      break
    }
    case 'office': {
      g.rect(0, 0, W, H).fill(C.wallDeep)
      // 牆上的獎狀
      g.rect(140, 90, 240, 170).fill(C.wood)
      g.rect(156, 106, 208, 138).fill(C.paper)
      g.rect(900, 80, 260, 180).fill(C.glass)
      g.rect(0, 470, W, H - 470).fill(C.floor)
      // 主管大桌
      g.rect(120, 420, 1040, 90).fill(C.woodDeep)
      g.rect(140, 380, 160, 40).fill(C.paper)
      // 茶葉蛋
      g.ellipse(980, 400, 26, 20).fill(C.egg)
      break
    }
  }
}

function standee(kind: LeadId | 'jia'): Container {
  const c = new Container()
  const g = new Graphics()
  c.addChild(g)
  if (kind === 'zhou') {
    g.roundRect(-130, 170, 260, 330, 60).fill(C.zhouShirt)
    g.rect(-24, 130, 48, 60).fill(C.zhou)
    g.circle(0, 70, 84).fill(C.zhou)
    // 蓬鬆頭髮
    for (const [x, y, r] of [
      [-60, 20, 44],
      [-20, -6, 50],
      [30, -4, 50],
      [70, 24, 40],
    ] as const)
      g.circle(x, y, r).fill(C.zhouHair)
    g.roundRect(-20, 220, 40, 160, 10).fill(C.zhou) // 識別證帶
  } else if (kind === 'shen') {
    g.roundRect(-140, 170, 280, 330, 40).fill(C.shenShirt)
    g.poly([-30, 170, 30, 170, 0, 260]).fill(C.paper) // 襯衫領口
    g.rect(-22, 130, 44, 60).fill(C.shen)
    g.ellipse(0, 70, 76, 88).fill(C.shen)
    g.roundRect(-82, -20, 164, 70, 30).fill(C.shenHair)
    g.rect(-82, 10, 26, 70).fill(C.shenHair)
    // 眼鏡
    g.roundRect(-52, 64, 40, 22, 4).fill(C.shenHair)
    g.roundRect(12, 64, 40, 22, 4).fill(C.shenHair)
    g.roundRect(-48, 68, 32, 14, 3).fill(C.glass)
    g.roundRect(16, 68, 32, 14, 3).fill(C.glass)
  } else {
    g.roundRect(-170, 170, 340, 330, 90).fill(C.jiaShirt)
    g.rect(-26, 130, 52, 60).fill(C.jiaSkin)
    g.ellipse(0, 70, 92, 96).fill(C.jiaSkin)
    // 地中海與反光
    g.rect(-96, 50, 26, 60).fill(C.jia)
    g.rect(70, 50, 26, 60).fill(C.jia)
    g.ellipse(-30, 10, 30, 12).fill(C.paper)
    // 茶葉蛋
    g.ellipse(150, 260, 34, 26).fill(C.egg)
  }
  return c
}

/** 已載入的美術貼圖。缺少的會退回色塊佔位圖。 */
export interface SceneArt {
  bg: Partial<Record<LocationId, Texture>>
  sprites: Partial<Record<CastId, Partial<Record<Expression, Texture>>>>
  cg?: Partial<Record<CgId, Texture>>
}

type CastId = LeadId | 'jia'

/** 立繪在舞台上的位置（中心 x、頭頂 y）與縮放 */
const SPRITE_LAYOUT: Record<CastId, { x: number; y: number; scale: number }> = {
  zhou: { x: 800, y: 48, scale: 0.62 },
  shen: { x: 800, y: 40, scale: 0.62 },
  jia: { x: 340, y: 90, scale: 0.6 },
}
const STANDEE_POS: Record<CastId, [number, number]> = {
  zhou: [820, 250],
  shen: [820, 240],
  jia: [360, 250],
}
/** 沒在說話的角色稍微變暗 */
const DIM = 0xa8acb4

/** 對話場景：背景圖加上立繪；沒有圖的部分用色塊佔位 */
export class OfficeScene {
  readonly root = new Container()
  private bgDrawn = new Graphics()
  private bgSprite = new Sprite()
  private cast: Record<CastId, Container>
  private sprites: Partial<Record<CastId, Sprite>> = {}
  private targets = new Map<Container, number>()
  /** 結局 CG：蓋在背景與立繪上面 */
  private cg = new Sprite()
  private cgLayer = new Container()
  reducedMotion = false

  constructor(
    ticker: Ticker,
    private art: SceneArt = { bg: {}, sprites: {} },
  ) {
    this.root.addChild(this.bgDrawn, this.bgSprite)
    this.cast = {} as Record<CastId, Container>
    for (const id of ['jia', 'zhou', 'shen'] as const) {
      const normal = art.sprites[id]?.normal
      let c: Container
      if (normal) {
        const sprite = new Sprite(normal)
        const { x, y, scale } = SPRITE_LAYOUT[id]
        sprite.anchor.set(0.5, 0)
        sprite.scale.set(scale)
        sprite.position.set(x, y)
        this.sprites[id] = sprite
        c = new Container()
        c.addChild(sprite)
      } else {
        c = standee(id)
        c.position.set(...STANDEE_POS[id])
      }
      c.alpha = 0
      this.cast[id] = c
      this.root.addChild(c)
    }
    this.cgLayer.alpha = 0
    this.cgLayer.addChild(this.cg)
    this.root.addChild(this.cgLayer)
    ticker.add(this.tick)
  }

  setLocation(loc: LocationId) {
    const tex = this.art.bg[loc]
    if (tex) {
      this.bgDrawn.clear()
      this.bgSprite.texture = tex
      // 等比填滿 1280×720
      const scale = Math.max(W / tex.width, H / tex.height)
      this.bgSprite.scale.set(scale)
      this.bgSprite.position.set((W - tex.width * scale) / 2, (H - tex.height * scale) / 2)
      this.bgSprite.visible = true
    } else {
      this.bgSprite.visible = false
      drawLocation(this.bgDrawn, loc)
    }
  }

  /** 顯示結局 CG；沒有圖或傳 null 時隱藏。淡入只動 alpha */
  setCg(id: CgId | null) {
    const tex = id ? this.art.cg?.[id] : undefined
    if (tex) {
      this.cg.texture = tex
      const scale = Math.max(W / tex.width, H / tex.height)
      this.cg.scale.set(scale)
      this.cg.position.set((W - tex.width * scale) / 2, (H - tex.height * scale) / 2)
    }
    const on = !!tex
    if (this.reducedMotion) {
      this.cgLayer.alpha = on ? 1 : 0
      this.targets.delete(this.cgLayer)
    } else {
      this.targets.set(this.cgLayer, on ? 1 : 0)
    }
  }

  /** 顯示站在場上的人與表情；沒在說話的人變暗。淡入淡出只動 alpha 與 y */
  setCast(
    lead: LeadId | null,
    jia: boolean,
    expression: Expression,
    speaker: string | null,
    jiaExpression: Expression = 'normal',
  ) {
    this.show(this.cast.zhou, lead === 'zhou')
    this.show(this.cast.shen, lead === 'shen')
    this.show(this.cast.jia, jia)
    const jiaTex = this.art.sprites.jia?.[jiaExpression] ?? this.art.sprites.jia?.normal
    if (this.sprites.jia && jiaTex) this.sprites.jia.texture = jiaTex
    if (lead) {
      const tex = this.art.sprites[lead]?.[expression] ?? this.art.sprites[lead]?.normal
      const sprite = this.sprites[lead]
      if (sprite && tex) sprite.texture = tex
    }
    // 有人說話時，其他角色變暗；旁白和內心獨白時都不變暗
    const talking = speaker === 'zhou' || speaker === 'shen' || speaker === 'jia' ? speaker : null
    for (const id of ['zhou', 'shen', 'jia'] as const) {
      const sprite = this.sprites[id]
      if (sprite) sprite.tint = talking && talking !== id ? DIM : 0xffffff
    }
  }

  /** 心跳：立繪跟著「咚—咚」輕微脹縮。時間與 HeartbeatFx、音效共用同一組數字 */
  beat(lead: LeadId, strength: 'soft' | 'strong') {
    const sprite = this.sprites[lead]
    if (!sprite || this.reducedMotion) return
    this.pulse = {
      sprite,
      base: SPRITE_LAYOUT[lead].scale,
      amp: strength === 'strong' ? 0.016 : 0.009,
      beats: strength === 'strong' ? 3 : 2,
      elapsed: 0,
    }
  }

  private pulse: {
    sprite: Sprite
    base: number
    amp: number
    beats: number
    elapsed: number
  } | null = null

  private tickPulse(ms: number) {
    const p = this.pulse
    if (!p) return
    p.elapsed += ms
    const total = p.beats * HEART_PERIOD_MS
    if (p.elapsed >= total) {
      p.sprite.scale.set(p.base)
      this.pulse = null
      return
    }
    const local = p.elapsed % HEART_PERIOD_MS
    // 兩下衝擊：0ms 與 HEART_DUB_MS，各自指數衰減
    const hit = (at: number, size: number) =>
      local >= at ? size * Math.exp(-(local - at) / 70) : 0
    const env = hit(0, 1) + hit(HEART_DUB_MS, 0.75)
    p.sprite.scale.set(p.base * (1 + p.amp * env))
  }

  private show(c: Container, on: boolean) {
    const target = on ? 1 : 0
    if (this.reducedMotion) {
      c.alpha = target
      this.targets.delete(c)
      return
    }
    if (on && c.alpha === 0) c.pivot.y = -24
    this.targets.set(c, target)
  }

  private tick = (t: Ticker) => {
    this.tickPulse(t.deltaMS)
    const k = Math.min(1, t.deltaMS / 160)
    for (const [c, target] of this.targets) {
      c.alpha += (target - c.alpha) * k
      c.pivot.y += (0 - c.pivot.y) * k
      if (Math.abs(target - c.alpha) < 0.01) {
        c.alpha = target
        c.pivot.y = 0
        this.targets.delete(c)
      }
    }
  }
}
