import { Application } from 'pixi.js'
import { OfficeScene } from './officeScene'
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

  const office = new OfficeScene(app.ticker)
  const minigame = new BossMinigame(app.ticker)
  app.stage.addChild(office.root, minigame.root)

  return {
    office,
    minigame,
    destroy: () => app.destroy(true, { children: true }),
  }
}
