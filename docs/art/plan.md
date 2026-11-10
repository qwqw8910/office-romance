# 美術計畫：第一輪（兩位男角）

> 規格見 [../SPEC.md](../SPEC.md)。原始構想見 [../ideas/office-romance-game.md](../ideas/office-romance-game.md) 的「美術規劃」。

## 決定

| 項目 | 決定 |
| --- | --- |
| 生圖工具 | ChatGPT 網頁版（gpt-image），以 Playwright 操作一個獨立設定檔的 Chrome，玩家本人登入 |
| 畫風 | 乾淨的日系乙女遊戲風：清楚線稿、賽璐璐上色、柔和色彩 |
| 第一輪範圍 | 周以澄、沈硯：各一張角色設定圖，加 4 個表情（一般、臉紅、微笑、驚訝），約 10–14 張 |
| 一致性做法 | 先生成設定圖並挑選一張；之後每張表情都上傳該設定圖當參考，用「依參考圖修改」的方式生成 |

## 檔案位置與命名

```
art-raw/                         # 所有下載的原始圖，不進 Git
public/art/characters/
  zhou/sheet.png                 # 選定的設定圖
  zhou/normal.png                # 半身立繪，透明或純白背景
  zhou/blush.png
  zhou/smile.png
  zhou/surprised.png
  shen/...（同上）
```

遊戲中劇本的 `mood` 對應到表情：臉紅、爆紅、偷笑 → `blush`；笑、眼睛發亮、自信 → `smile`；嘆氣以外的驚嚇、撲過去擦 → `surprised`；其他 → `normal`。接圖時再補完整對照表。

## 共同風格描述（每張提示詞都帶）

> Japanese otome game character art, clean crisp line art, cel shading, soft pastel lighting, high quality visual novel sprite style, modern Taipei office setting, no text, no watermark, no logo.

## 角色設定

### 周以澄（年下忠犬系）
- 24 歲，新進工程師，身高約 178 cm，偏瘦。
- 蓬鬆微亂的深棕色短髮，溫暖的棕色大眼睛，表情直率、容易臉紅。
- 服裝：米白色寬鬆針織開襟衫，裡面白色 T 恤，淺色牛仔褲，脖子上掛公司識別證掛繩。
- 代表色：暖橘、米色。

### 沈硯（冷淡系，嘴冷手暖）
- 31 歲，法務，身高約 185 cm，肩膀寬、站姿挺。
- 黑色短髮，往後梳但留少許瀏海，細銀框長方形眼鏡，灰色眼睛，眼神銳利、表情冷靜。
- 服裝：深海軍藍西裝外套、白襯衫、深色細領帶微鬆。
- 代表色：海軍藍、灰。

## 提示詞

### 1. 角色設定圖（每人先生成 2 張挑 1 張）

**周以澄**
```
Character design reference sheet of one original male character for a Japanese otome game.
Full-body front view, side view and back view standing side by side, plus one large head-and-shoulders close-up, on a plain white background.
He is 24, a junior software engineer, slim, about 178 cm. Fluffy, slightly messy dark-brown short hair, big warm brown eyes, earnest and easily flustered expression.
Outfit: oversized cream knit cardigan over a white T-shirt, light-blue jeans, white sneakers, a company ID badge on a lanyard.
Colour accents warm orange and beige.
Japanese otome game character art, clean crisp line art, cel shading, soft pastel lighting, high quality visual novel sprite style, no text, no watermark, no logo.
Landscape 3:2.
```

**沈硯**
```
Character design reference sheet of one original male character for a Japanese otome game.
Full-body front view, side view and back view standing side by side, plus one large head-and-shoulders close-up, on a plain white background.
He is 31, a corporate legal counsel, tall about 185 cm with broad shoulders and upright posture. Short black hair swept back with a few loose strands of fringe, thin silver rectangular glasses, grey eyes, sharp gaze, calm and reserved expression.
Outfit: dark navy suit jacket and trousers, white shirt, slim dark tie slightly loosened, black leather shoes.
Colour accents navy and grey.
Japanese otome game character art, clean crisp line art, cel shading, soft pastel lighting, high quality visual novel sprite style, no text, no watermark, no logo.
Landscape 3:2.
```

### 2. 表情立繪（上傳選定的設定圖當參考）

```
Using the attached character sheet as the exact reference (same face, hair, eyes, outfit, colours and art style), draw a waist-up visual novel sprite of the same character facing the viewer, slightly turned, centred, on a plain white background.
Expression: {EXPRESSION}.
Japanese otome game character art, clean crisp line art, cel shading, soft pastel lighting, no text, no watermark, no logo.
Portrait 2:3.
```

| 檔名 | {EXPRESSION} |
| --- | --- |
| `normal` | neutral, relaxed, looking at the viewer |
| `blush` | flustered and blushing, eyes looking slightly away, embarrassed small smile |
| `smile` | warm genuine smile, eyes softened |
| `surprised` | surprised, eyes wide, mouth slightly open |

## 檢查與挑選

- 每張圖檢查：臉、髮型、眼鏡（沈硯）、服裝和設定圖一致；手指與比例沒有明顯錯誤；沒有文字或浮水印。
- 不一致的表情就重新生成，最多重試 2 次；仍不行就記錄下來，改用 API 或手動修圖。
- 選定的圖才放進 `public/art/characters/`，並在本文件記錄來源對話與日期。

## 紀錄

### 2026-11-10 第一輪
- 工具：ChatGPT 免費版網頁（gpt-image），Playwright 透過 Chrome 遠端除錯連線操作。第一個帳號在 3 張圖後用完當日額度，其餘改用第二個帳號的無痕視窗完成。
- 設定圖：兩人各生成 1 張，直接採用（未生成備選）。沈硯設定圖的側面頭髮偏咖啡色，生成表情時在提示詞加上「BLACK hair (not brown)」，結果四張都是黑髮。
- 表情：8 張全部第一次就採用，未重試。
- 輸出：設定圖 1536×1024，表情 1024×1536，PNG，**白色背景（非透明）**。

| 檔案 | 檢查結果 |
| --- | --- |
| `zhou/sheet.png` | 符合設定，三視圖一致 |
| `zhou/normal.png` | 一致 |
| `zhou/blush.png` | 一致，手摸後頸，害羞感明確 |
| `zhou/smile.png` | 一致 |
| `zhou/surprised.png` | 一致 |
| `shen/sheet.png` | 側面頭髮偏咖啡色，特寫為準 |
| `shen/normal.png` | 一致，黑髮 |
| `shen/blush.png` | 一致；表情偏「挑眉壞笑」而不是害羞，符合嘴冷手暖的反差，可接受 |
| `shen/smile.png` | 一致 |
| `shen/surprised.png` | 一致，表情比較像「不悅的驚訝」 |

### 待辦
- 白底需要去背才能疊在場景上（可用遊戲內以 multiply 混合模式暫代，或之後統一去背）。
- 每張約 1.6 MB，正式版轉成 WebP 以縮小體積。
- 女主、主管、5 個場景背景尚未生成。
