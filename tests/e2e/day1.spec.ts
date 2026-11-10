import { expect, test, type Page } from '@playwright/test'

/** 從頁面讀出目前狀態（透過 ?test 掛上的 window.__game） */
async function snapshot(page: Page) {
  return page.evaluate(() => {
    interface TestHook {
      state: { phase: string }
      bossStage: string
      bossEvent: { cover: string } | null
      timeline: { exposures: [number, number][] } | null
      frame: { t: number } | null
    }
    const g = (window as unknown as { __game: TestHook }).__game
    return {
      phase: g.state.phase,
      bossStage: g.bossStage,
      cover: g.bossEvent?.cover ?? null,
      exposures: g.timeline?.exposures ?? [],
      t: g.frame?.t ?? 0,
    }
  })
}

const COVER_KEY: Record<string, string> = { phone: '1', copy: '2', pen: '3' }

/**
 * 只用鍵盤玩完一天。skill=true 時真的玩小遊戲：
 * 在每段曝光前 0.5 秒按 Space，並先按對應的掩護鍵。
 */
async function playDay(page: Page, skill: boolean) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('/?seed=42&test')
  await page.getByRole('button', { name: /開始上班/ }).press('Enter')

  let covered = 0
  for (let i = 0; i < 2000; i++) {
    const s = await snapshot(page)
    if (s.phase === 'ending') break
    if (s.bossStage === 'brief') {
      covered = 0
      await page.keyboard.press('Enter')
    } else if (s.bossStage === 'running') {
      if (skill) {
        if (s.cover) await page.keyboard.press(COVER_KEY[s.cover]!)
        const next = s.exposures[covered]
        if (next && s.t >= next[0] - 0.5) {
          await page.keyboard.press('Space')
          covered++
        }
      }
      await page.waitForTimeout(30)
      continue
    } else if (s.bossStage === 'result') {
      await page.waitForTimeout(100)
      continue
    } else if (s.phase === 'choice') {
      await page.keyboard.press('1')
    } else {
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(20)
  }
  return errors
}

test('keyboard-only run with good cover reaches the safe ending', async ({ page }) => {
  const errors = await playDay(page, true)
  await expect(page.getByRole('heading', { name: '平安下班' })).toBeVisible()
  // 按鍵時機靠輪詢，CI 機器較慢時偶爾會漏接一次；只要沒被約談滿三次就算過
  await expect(page.getByText('3 / 3 次')).toBeHidden()
  expect(errors).toEqual([])
})

test('never covering gets caught three times', async ({ page }) => {
  const errors = await playDay(page, false)
  await expect(page.getByRole('heading', { name: '被約談了' })).toBeVisible()
  await expect(page.getByText('3 / 3 次')).toBeVisible()
  expect(errors).toEqual([])
})

test('Esc pauses and the menu offers reduced motion', async ({ page }) => {
  await page.goto('/?seed=1&test&slot=2')
  await page.getByRole('button', { name: /開始上班/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '暫停' })).toBeVisible()
  await page.getByLabel(/減少動態效果/).check()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '暫停' })).toBeHidden()
  await expect(page.getByRole('heading', { name: '茶水間' })).toBeVisible()
})

test('progress survives a reload and can be continued', async ({ page }) => {
  await page.goto('/?seed=1&test&slot=2')
  await page.getByRole('button', { name: /開始上班/ }).click()
  await expect(page.getByRole('heading', { name: '茶水間' })).toBeVisible()

  await page.goto('/?seed=1&test')
  const resume = page.getByRole('button', { name: /繼續上班/ })
  await expect(resume).toContainText('茶水間')
  await resume.click()
  await expect(page.getByRole('heading', { name: '茶水間' })).toBeVisible()

  // 重新開始會蓋掉存檔，從開場重來
  await page.goto('/?seed=1&test')
  await page.getByRole('button', { name: /重新開始/ }).click()
  await expect(page.getByRole('heading', { name: '茶水間' })).toBeHidden()
})
