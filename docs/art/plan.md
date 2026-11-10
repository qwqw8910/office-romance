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

### 2026-11-10 第二輪（女主、主管、背景）
- 第二個帳號生成 4 張後額度用完。
- 完成：`lin/sheet.png`（女主設定圖，低馬尾、炭灰西裝、玫瑰色隨行杯）、`jia/sheet.png`（主管設定圖，地中海、芥末黃領帶、茶葉蛋）、`jia/normal.png`（主管半身立繪，得意笑）、`bg/desk.png`（座位區，1672×941，窗外有台北 101）。
- 未完成：其餘 6 張背景（茶水間、頂樓、影印室、會議室、電梯口、經理辦公室），提示詞見下方。

### 背景提示詞

共同部分：
```
Please generate an image.

Visual novel background art for a Japanese otome game, wide landscape, eye-level view, no people, no characters, no text, no signs with letters, no watermark.
Scene: {SCENE}
Clean anime background painting style, soft cel-shaded lighting, gentle pastel colours, detailed but uncluttered, modern Taipei office building.
Landscape 16:9.
```

| 檔名 | 狀態 | {SCENE} |
| --- | --- | --- |
| `bg/desk.png` | 完成 | an open-plan office seating area in the morning after a meeting: rows of white desks with monitors and keyboards, low partitions, a desk phone in the foreground desk, office chairs, large windows with a city view and soft morning sunlight. |
| `bg/pantry.png` | 完成 | a small office pantry: a counter with a coffee machine, mugs and a kettle, upper cabinets, a refrigerator, a wall-mounted phone, a small window, warm late-morning light. |
| `bg/rooftop.png` | 完成 | the rooftop of an office building at noon: a wooden bench, a metal railing, potted plants, a water tank, the city skyline under a clear blue sky with a few clouds. |
| `bg/copyroom.png` | 完成 | a cramped office copy room: a large multi-function photocopier, shelves stacked with reams of paper and binders, a paper cutter, fluorescent lights, afternoon light from a small window. |
| `bg/meeting.png` | 完成 | an office meeting room at 5:30 pm: a long wooden meeting table with chairs, a whiteboard with faint scribbles, window blinds half open, warm orange sunset light, only half of the ceiling lights on. |
| `bg/elevator.png` | 完成 | an office building elevator lobby at 6 pm: closed brushed-steel elevator doors, call buttons, a polished floor, warm evening light, calm after-work atmosphere. |
| `bg/office.png` | 完成 | a self-important manager's private office: a big dark-wood desk with a nameplate without letters, framed award certificates on the wall, a golf putter in the corner, a bowl of tea eggs on the desk, blinds, a slightly tacky leather chair, comedic atmosphere. |

### 2026-11-10 第三輪（其餘背景）
- 第三個帳號（無痕視窗）一次完成 6 張背景，沒有碰到額度上限。
- 茶水間這次一次回了 2 張，採用第 1 張（暖色、有圓桌，適合兩人場景）；第 2 張留在 `art-raw/bg-pantry-a-2.png` 備用。
- 每張背景窗外都有台北 101，場景之間的城市感一致。

### 接進遊戲
- 原始 PNG 放在 `art-src/`（設定圖也在這裡，之後生圖當參考圖用）；遊戲用的 WebP 由 `npm run art`（[tools/art/process.py](../../tools/art/process.py)）產生到 `public/art/`。
- 去背：從上、左、右三邊對純白做 flood fill（不從下緣，避免吃掉白 T 恤與襯衫），再補一輪「靠近背景的白色空隙」（髮絲間），邊緣 4px 依亮度半透明。
- 體積：原始圖約 35 MB，WebP 共約 1.9 MB（立繪約 70–115 KB，背景約 110–190 KB）。
- 劇本 mood 對表情的對照在 [src/content/expressions.ts](../../src/content/expressions.ts)；未列出的 mood 用 `normal`。
- 主管只有 `normal` 一張立繪；女主不出現在場景中，只在標題畫面的識別證上（`lin/badge.webp`，從設定圖特寫裁切）。

### 待辦
- 主管其他表情（生氣、驚訝）、女主的表情（如果之後要在對話框旁顯示頭像）。
- 沈硯 `blush` 偏壞笑，若試玩覺得不像害羞再重生成。
