import { Application, Assets, type Texture } from 'pixi.js'
import { OfficeScene, type SceneArt } from './officeScene'
import { art, EXPRESSIONS } from '../content/expressions'
import type { LocationId } from '../game/types'
import { BossMinigame } from './bossMinigame'
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

  const office = new OfficeScene(app.ticker, await loadArt())
  const minigame = new BossMinigame(app.ticker)
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
  jia: ['normal'],
}

/** 載入背景與立繪；單張失敗不影響其他張，缺的部分由佔位圖頂替 */
async function loadArt(): Promise<SceneArt> {
  const load = (url: string) => Assets.load<Texture>(url).catch(() => undefined)
  const result: SceneArt = { bg: {}, sprites: {} }
  await Promise.all([
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
