/** 所有難度參數集中在這裡，試玩後調整。單位：秒、像素（邏輯解析度 1280×720）。 */
export const tuning = {
  affection: { start: 20, min: 0, max: 100, readAt: 40, typingAt: 70 },
  suspicion: { max: 3 },
  /** 大膽選項累積的熱度：每點讓主管視線變遠、突襲預兆變短，事件結束後歸零 */
  risk: { sightPerHeat: 0.3, tellPerHeat: 0.25 },
  /** 被抓時，事件男角好感達到這個值會出來救場（每天一次） */
  rescueAt: 60,

  boss: {
    successBonus: 5,
    awkwardPenalty: -5,
    /** 掩護持續時間與冷卻 */
    coverDuration: 2.0,
    coverCooldown: 1.0,
    /** 走道與視線 */
    corridorStart: -80,
    corridorEnd: 1360,
    heroineX: 640,
    sightRange: 170,
    patrolSpeed: 300,
    ambushTell: 0.8,
    ambushSpeed: 720,
    fakeoutSpeed: 300,
    fakeoutPauseMin: 1.0,
    fakeoutPauseMax: 1.5,
    fakeoutReturnSpeed: 520,
    /** 開場在畫面外的等待時間 */
    leadIn: 0.6,
    /** 事件結束後的停留 */
    tail: 0.4,
  },
  /** 減少動態效果時，判定放寬的倍率 */
  reducedMotionLeniency: 1.2,
} as const

export type Tuning = typeof tuning
