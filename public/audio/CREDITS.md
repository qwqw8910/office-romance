# 音訊來源

全部是 CC0（公眾領域貢獻），法律上不需標註；這裡記下來源方便日後追查。
授權標示以各頁面下載當天的欄位為準。

## 背景音樂（music/）

| 檔案 | 用在 | 曲名 | 來源 | 授權 |
| --- | --- | --- | --- | --- |
| lofi-chill.ogg | 平常的對話 | Chill lofi inspired [loop edit]（qubodup 剪輯自 omfgdude 作品） | https://opengameart.org/content/chill-lofi-inspired-loop-edit | CC0 |
| suspicious-loop.mp3 | 主管巡視（緊張） | Suspicious Loop（Hazmat Harry） | https://opengameart.org/content/suspicious-loop | CC0 |

## 音效（sfx/）

來自 Kenney「Interface Sounds」1.0，https://kenney.nl/assets/interface-sounds ，CC0。
只挑用到的 7 個檔案，授權原文在 sfx/KENNEY-LICENSE.txt。

| 檔案 | 用在 |
| --- | --- |
| select_002.ogg | 選項被聚焦 |
| confirmation_001.ogg | 確定選項 |
| drop_001.ogg | 便利貼貼上 |
| switch_002.ogg | 按下掩護 |
| confirmation_003.ogg | 主管事件過關 |
| question_001.ogg | 主管事件尷尬過關 |
| error_004.ogg | 被抓（疊在合成低音上） |

## 合成音效

心跳、逐字點聲、電梯叮、會議通知、蓋章，以及音檔載入失敗時的備用音樂，
都由 src/audio/engine.ts 用 Web Audio 即時合成，沒有外部素材。
