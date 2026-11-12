import { Application, Assets, type Texture } from 'pixi.js'
import { OfficeScene, type SceneArt } from './officeScene'
import { art, CG_IDS, EXPRESSIONS, JIA_EXPRESSIONS } from '../content/expressions'
import type { LocationId } from '../game/types'
import { BossMinigame, MINIGAME_ART, type MinigameArt } from './bossMinigame'
import { C } from './palette'

export const STAGE_W = 1280
export const STAGE_H = 720

export interface Stage {
  office: OfficeScene
  minigame: BossMinigame
  destroy(): void
}

/** 建立 Pixi 畫布。邏輯解析度固定 1280×720，外層用 CSS 等比縮放。 */
export async function createStage(host: HTMLElement): Promise<Stage> {
  const app = new Application()
  await app.init({
    width: STAGE_W,
    height: STAGE_H,
    background: C.paper,
    antialias: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    autoDensity: true,
  })
  app.canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(app.canvas)

  const [sceneArt, minigameArt] = await Promise.all([loadArt(), loadMinigameArt()])
  const office = new OfficeScene(app.ticker, sceneArt)
  const minigame = new BossMinigame(app.ticker, minigameArt)
  app.stage.addChild(office.root, minigame.root)

  return {
    office,
    minigame,
    destroy: () => app.destroy(true, { children: true }),
  }
}

const LOCATIONS: LocationId[] = [
  'desk',
  'pantry',
  'rooftop',
  'copyroom',
  'meeting',
  'elevator',
  'office',
]
const SPRITES: Record<string, readonly string[]> = {
  zhou: EXPRESSIONS,
  shen: EXPRESSIONS,
  jia: JIA_EXPRESSIONS,
}

/** 載入單張圖；失敗會重試，仍失敗回傳 undefined，由佔位圖頂替 */
const load = (url: string) =>
  Assets.load<Texture>(url, { strategy: 'retry', retryCount: 3, retryDelay: 800 }).catch(
    () => undefined,
  )

/** 小遊戲的地板、Q 版角色與道具；缺的部分用色塊佔位 */
async function loadMinigameArt(): Promise<MinigameArt> {
  const out: MinigameArt = {}
  await Promise.all(
    MINIGAME_ART.map(async (name) => {
      const tex = await load(art.minigame(name))
      if (tex) out[name] = tex
    }),
  )
  return out
}

/**
 * 載入背景與立繪。網路不穩時每張會重試幾次；
 * 單張最後仍失敗也不影響其他張，缺的部分由佔位圖頂替。
 */
async function loadArt(): Promise<SceneArt> {
  const result: SceneArt = { bg: {}, sprites: {}, cg: {} }
  await Promise.all([
    ...CG_IDS.map(async (id) => {
      const tex = await load(art.cg(id))
      if (tex) result.cg![id] = tex
    }),
    ...LOCATIONS.map(async (loc) => {
      const tex = await load(art.bg(loc))
      if (tex) result.bg[loc] = tex
    }),
    ...Object.entries(SPRITES).flatMap(([who, exprs]) =>
      exprs.map(async (e) => {
        const tex = await load(art.sprite(who, e as (typeof EXPRESSIONS)[number]))
        if (!tex) return
        const id = who as keyof SceneArt['sprites']
        result.sprites[id] = { ...result.sprites[id], [e]: tex }
      }),
    ),
  ])
  return result
}
