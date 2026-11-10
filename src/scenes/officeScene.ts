import { Container, Graphics, Ticker } from 'pixi.js'
import type { LeadId, LocationId } from '../game/types'
import { C } from './palette'

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

/** 對話場景：背景加上佔位立繪 */
export class OfficeScene {
  readonly root = new Container()
  private bg = new Graphics()
  private cast: Record<LeadId | 'jia', Container> = {
    zhou: standee('zhou'),
    shen: standee('shen'),
    jia: standee('jia'),
  }
  private targets = new Map<Container, number>()
  reducedMotion = false

  constructor(ticker: Ticker) {
    this.root.addChild(this.bg)
    this.cast.zhou.position.set(820, 250)
    this.cast.shen.position.set(820, 240)
    this.cast.jia.position.set(360, 250)
    for (const c of Object.values(this.cast)) {
      c.alpha = 0
      this.root.addChild(c)
    }
    ticker.add(this.tick)
  }

  setLocation(loc: LocationId) {
    drawLocation(this.bg, loc)
  }

  /** 顯示站在場上的人；淡入淡出只動 alpha 與 y */
  setCast(lead: LeadId | null, jia: boolean) {
    this.show(this.cast.zhou, lead === 'zhou')
    this.show(this.cast.shen, lead === 'shen')
    this.show(this.cast.jia, jia)
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
