/** 劇本 mood（佔位表情文字）對應到立繪的表情。未列出的 mood 用 normal。 */
export type Expression = 'normal' | 'blush' | 'smile' | 'surprised' | 'stern'

/** 男角的 4 種表情 */
export const EXPRESSIONS: readonly Expression[] = ['normal', 'blush', 'smile', 'surprised']
/** 主管的表情：一般（得意笑）、嚴肅（認真時才戴眼鏡） */
export const JIA_EXPRESSIONS: readonly Expression[] = ['normal', 'stern']

const JIA_MOOD: Record<string, Expression> = {
  嚴肅: 'stern',
  推眼鏡: 'stern',
  眯眼: 'stern',
  狐疑: 'stern',
  停下: 'stern',
}

export function jiaExpressionFor(mood: string | undefined): Expression {
  return (mood && JIA_MOOD[mood]) || 'normal'
}

const MOOD_TO_EXPRESSION: Record<string, Expression> = {
  // 害羞、心動
  臉紅: 'blush',
  爆紅: 'blush',
  偷笑: 'blush',
  不敢動: 'blush',
  別過頭: 'blush',
  緊張: 'blush',
  尷尬: 'blush',
  垂頭: 'blush',
  // 開心
  笑: 'smile',
  眼睛發亮: 'smile',
  自信: 'smile',
  握拳: 'smile',
  對看一眼: 'smile',
  嘴角動了一下: 'smile',
  收進口袋: 'smile',
  // 驚訝、慌張
  撲過去擦: 'surprised',
  立正: 'surprised',
  喘氣跑上來: 'surprised',
  額頭青筋: 'surprised',
}

export function expressionFor(mood: string | undefined): Expression {
  return (mood && MOOD_TO_EXPRESSION[mood]) || 'normal'
}

export type HeartStrength = 'soft' | 'strong'

/** 這些 mood 是整段劇情裡最「心臟漏一拍」的瞬間，演出加強 */
const STRONG_HEARTBEAT = new Set(['爆紅', '不敢動'])

/** 臉紅類的 mood 會觸發心跳演出；其他 mood 回傳 null */
export function heartbeatFor(mood: string | undefined): HeartStrength | null {
  if (!mood || expressionFor(mood) !== 'blush') return null
  return STRONG_HEARTBEAT.has(mood) ? 'strong' : 'soft'
}

/** 遊戲使用的美術檔路徑（public/art，由 tools/art/process.py 產生） */
export const art = {
  bg: (location: string) => `${import.meta.env.BASE_URL}art/bg/${location}.webp`,
  sprite: (character: string, expression: Expression) =>
    `${import.meta.env.BASE_URL}art/characters/${character}/${expression}.webp`,
  badge: () => `${import.meta.env.BASE_URL}art/characters/lin/badge.webp`,
  minigame: (name: string) => `${import.meta.env.BASE_URL}art/minigame/${name}.webp`,
  cg: (name: CgId) => `${import.meta.env.BASE_URL}art/cg/${name}.webp`,
}

/** 結局 CG */
export type CgId = 'zhou-safe' | 'shen-safe' | 'pair'
export const CG_IDS: readonly CgId[] = ['zhou-safe', 'shen-safe', 'pair']
