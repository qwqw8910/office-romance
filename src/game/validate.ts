import type { Beat, Script } from './types'

/** 檢查劇本資料：選項數量、好感變化範圍、主管事件的台詞、分支覆蓋兩位男角。空陣列代表通過。 */
export function validateScript(script: Script): string[] {
  const problems: string[] = []
  const checkBeats = (where: string, beats: Beat[]) => {
    if (beats.length === 0) problems.push(`${where}: 沒有任何節拍`)
    beats.forEach((beat, i) => {
      const at = `${where}[${i}]`
      if (beat.kind === 'line' && !beat.text.trim()) problems.push(`${at}: 空台詞`)
      if (beat.kind === 'choice') {
        if (beat.options.length < 2 || beat.options.length > 3)
          problems.push(`${at}: 選項需 2–3 個，目前 ${beat.options.length}`)
        beat.options.forEach((o, j) => {
          if (!o.text.trim()) problems.push(`${at}.options[${j}]: 空選項`)
          o.effects?.forEach((e) => {
            if (e.delta < -10 || e.delta > 15)
              problems.push(`${at}.options[${j}]: 好感變化超出 −10…+15`)
          })
        })
      }
      if (beat.kind === 'boss') {
        for (const key of ['success', 'awkward', 'caught'] as const) {
          if (beat[key].length === 0) problems.push(`${at}: 缺少 ${key} 台詞`)
        }
      }
    })
  }
  checkBeats('opening', script.opening)
  for (const slot of script.slots) {
    if (Array.isArray(slot.beats)) checkBeats(slot.id, slot.beats)
    else {
      checkBeats(`${slot.id}.zhou`, slot.beats.byLead.zhou)
      checkBeats(`${slot.id}.shen`, slot.beats.byLead.shen)
      if (slot.beats.pair) checkBeats(`${slot.id}.pair`, slot.beats.pair)
    }
  }
  checkBeats('endings.safe.zhou', script.endings.safe.zhou)
  checkBeats('endings.safe.shen', script.endings.safe.shen)
  checkBeats('endings.caught', script.endings.caught)
  checkBeats('endings.alone', script.endings.alone)
  checkBeats('endings.pair', script.endings.pair)
  checkBeats('rescue.zhou', script.rescue.zhou)
  checkBeats('rescue.shen', script.rescue.shen)
  return problems
}
