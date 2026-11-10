---
name: pr-commit-push
description: 同步遠端最新、rebase、跑 lint／測試／建置、把目前所有修改合成一個 commit、push 並用 gh 開 PR。使用者說「commit 並開 PR」「push 並開 PR」「pr-commit-push」「送 PR」「提交推送」時使用。
---

# Fetch → Rebase → 檢查 → 單一 Commit → Push → 開 PR

專案是「辦公室心動日常」（Vue 3 + Pixi + Pinia + Vite，部署在 GitHub Pages）。
git repo 就是專案根目錄，所有 git 指令都在根目錄下執行。
Repo：`qwqw8910/office-romance`，預設分支 `main`，PR 的 base 預設為 `main`。

## 鐵則：一個功能分支 = 一個 PR = 一次 merge

GitHub 允許 merge commit，歷史圖靠下列規則保持乾淨，**必須絕對遵守**：

- 一個功能一條分支、一個 PR；新功能一律開新分支、開新 PR，**不在舊功能分支上疊新功能**。
- 新分支一律從最新的 `origin/main` 切出。
- 每次開 PR／更新 PR 前**一定要先 rebase** 到最新的 `origin/main`，不可跳過。
- 分支上只能有線性的 commit，**禁止在本地 `git merge`**（含 `git pull` 的 merge 行為；同步一律用 `git fetch` + `git rebase`）。merge commit 只由 GitHub 合併 PR 時產生。
- 不直接在 `main` 上 commit／push。

## 這個專案的 CI 與部署（寫 PR 與判斷風險時要知道）

`.github/workflows/ci.yml`：

- **每個 PR 與每次 push**：`npm run lint` → `npm test`（vitest）→ `npm run test:e2e`（Playwright，CI 用 Chromium）。任一失敗 PR 就是紅的。
- **只有 push 到 `main`**：建置並**自動部署到 GitHub Pages**。所以「merge 這個 PR = 上線」，PR 備註要寫清楚。

## 前置檢查

```bash
git fetch origin --prune
git branch --show-current
git status --short
gh auth status
gh repo view qwqw8910/office-romance --json viewerPermission --jq .viewerPermission
```

- `viewerPermission` 必須是 `WRITE`／`MAINTAIN`／`ADMIN`。只有 `READ`（或 `gh` 登入的帳號不是有權限的那個）時，**push 與 `gh pr create` 都會失敗**：停下來告訴使用者目前登入的帳號與權限，請使用者自己切換帳號（`gh auth switch`）或改用有權限的帳號；不要自行切換帳號、不要改 git config。仍可先完成本地的 rebase、檢查與 commit，並提供 `https://github.com/qwqw8910/office-romance/pull/new/<branch>` 網頁連結。
- 沒有任何修改且沒有領先 `origin/main` 的 commit → 告知使用者沒東西可送，結束。

### 判斷目前所在分支

| 情況 | 處理 |
| --- | --- |
| 在 `main`（或其他 base 分支） | 走下方「從 main 建立功能分支」 |
| 在功能分支，且其 PR 已合併（`gh pr list --head <branch> --state merged` 有結果，或 `git branch --merged origin/main` 含此分支） | 視同在 main：這條分支已用完，新修改要走「從 main 建立功能分支」 |
| 在功能分支，已有 **open** PR，且本次修改屬於同一功能 | 沿用此分支，繼續 Step 1 |
| 在功能分支，沒有 PR，且修改屬於這條分支名稱所代表的功能 | 沿用此分支，繼續 Step 1 |
| 在功能分支，但本次修改是**另一個功能** | 停下來問使用者；預設做法是切到新分支（見下），不要疊在這條分支上 |

### 從 main 建立功能分支

在 `main` 或已用完的分支上有未提交修改時，**先看修改內容，再決定分支，最後才 commit**：

1. `git status --short`、`git diff --stat`：讀懂這次修改在做什麼（二進位檔如圖片、音檔只看檔名與大小，不要 dump 內容）。
2. 依內容擬分支名與類型，向使用者確認。命名：`feat/…`、`fix/…`、`refactor/…`、`docs/…`、`chore/…`、`art/…`、`test/…`，英文小寫以連字號分隔，如 `feat/heartbeat-fx-and-audio`。
3. 本地 `main` 落後時不要 merge，直接以 `origin/main` 為起點切分支，未提交修改會一起帶過去：

   ```bash
   git switch -c <type>/<name> origin/main
   ```

   若切換因修改與 `origin/main` 衝突而失敗，改用 `git stash push -u` → `git switch -c <type>/<name> origin/main` → `git stash pop`。
4. 確認 `git branch --show-current` 已是新分支、`git status --short` 修改都還在，才進入 Step 1。**到此為止尚未 commit。**

## Step 1：檢查遠端有沒有別人的更新

```bash
git fetch origin --prune
git log --oneline HEAD..origin/main            # base 上別人新增的
git log --oneline HEAD..origin/<branch>        # 同名遠端分支上別人新增的（分支已存在於遠端時）
```

回報結果：base 與遠端分支各新增幾個 commit（列出 SHA 與標題）。用 `git merge-base --is-ancestor origin/main HEAD` 確認分支是否已包含最新 `origin/main`；已包含且遠端分支沒有他人新 commit 時，Step 2 的 rebase 為空操作，確認後即可略過指令，但**結論要在回報中寫明**。

## Step 2：Rebase 到最新

rebase 需要乾淨的工作目錄，有未提交修改時先暫存：

```bash
git stash push -u -m "pr-commit-push"          # 有未提交修改才做
git rebase origin/<branch>                     # 先吸收同名遠端分支上別人的 commit（若有）
git rebase origin/main
git stash pop                                  # 還原修改
```

- 遠端分支上有別人的 commit 時，**必須**先 rebase 到 `origin/<branch>`，否則之後 push 會蓋掉別人的工作。
- 發生衝突：列出衝突檔案，逐一讀內容解決並 `git add` + `git rebase --continue`；無法判斷哪邊正確時**停下來問使用者**，不要自行選邊。
- 若要放棄：`git rebase --abort`（並 `git stash pop` 還原），向使用者說明原因。
- `stash pop` 衝突時同樣處理，保留 stash 直到確認修改都回來了。
- `package-lock.json` 衝突不要手動合併：以 `origin/main` 的版本為準，再跑 `npm install` 重新產生。

## Step 3：本地檢查（對應 CI）

在 rebase 之後、commit 之前，依序跑，結果要如實回報：

```bash
npm run lint          # eslint + prettier --check，CI 一定會跑
npm test              # vitest 單元測試
npm run build         # vue-tsc 型別檢查 + vite build
npm run test:e2e      # Playwright，約 1 分鐘；改到流程、UI、音訊或存檔時一定要跑，純文件修改可略過
```

- 任何一項失敗：**不要 commit、不要 push**。說明失敗原因；是這次修改造成的就修好再跑；是原本就壞的或別人的檔案造成（例如不是這次改的檔案出現 lint 錯誤），停下來告訴使用者，由使用者決定是否先修、或在 PR 備註中註明。
- prettier 格式問題用 `npx prettier --write <檔案>` 修，只修這次動到的檔案。
- 略過某一項時，PR 的「測試」欄要寫明沒跑與原因。

## Step 4：檢視並確認 commit 內容

```bash
git status --short
git diff --stat
git diff -- src tests docs tools        # 程式與文件讀完整 diff；圖片、音檔不要 dump
```

- 依 diff 理解整體變更，作為 commit message 依據。
- **不要加入**：`.env*`、金鑰／token、`node_modules/`、`dist/`、`test-results/`、`playwright-report/`、`coverage/`、`.taste-skill/`、`art-raw/`、`*.local`、暫存檔（如 `pr.md`、`*.zip`）。發現疑似機密時停下來問使用者。
- **素材檢查**：
  - 新增或更換 `public/audio/**`、`public/art/**`、`art-src/**` 時，確認來源與授權已記錄（音訊記在 `public/audio/CREDITS.md`），且授權允許使用。
  - 單一檔案超過約 5 MB 要提醒使用者（會被部署到 GitHub Pages，也會讓 repo 變大）；`art-src/` 的原始大圖應經 `npm run art` 轉成 `public/art/` 的 WebP。
  - 壓縮檔（zip）不要放進 `public/`。
- 若含明顯無關的修改（與本次主題不同的功能），提醒使用者是否拆成另一個 PR。

輸出計畫並**等使用者確認再繼續**：

```markdown
**分支**：feat/xxx → main
**Commit**：feat(scope): title
**檔案**（N 個）：path/a, path/b …
**檢查**：lint ✅／❌、test ✅／❌、build ✅／❌、e2e ✅／❌／略過
```

## Step 5：產生單一 Commit

- 使用明確路徑 `git add <paths>`，不要 `git add -A` / `git add .`（避免誤加機密與暫存檔）。
- Message 沿用本專案既有紀錄的風格：Conventional Commits，**英文、祈使句、小寫開頭、標題不加句號**，內文用條列說明做了什麼與為什麼（劇本、介面上會看到的中文字串照原文寫）。例如 `feat: auto-save progress and deploy to GitHub Pages`。

```
<type>[(<scope>)]: <title>

- <what changed and why>
- <what changed and why>

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

- type：`feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `art`（美術素材與美術處理工具）。
- scope 可省略（既有紀錄大多沒有）；改動集中在單一模組時可用 `audio`、`ui`、`boss`、`save`、`script`、`art`。
- `Co-Authored-By` 行以當次 session 指定的署名為準（目前為 Claude Sonnet 5.5）。
- 用 heredoc 傳 message，commit 後 `git log --oneline -1` 確認。
- pre-commit hook 失敗 → 修正問題後重新 commit，**不要** `--no-verify`。

## Step 6：Push

```bash
git push -u origin <branch>                    # 首次 push
git push --force-with-lease origin <branch>    # 已 push 過且 Step 2 有 rebase 改寫歷史時
```

- 只用 `--force-with-lease`，**禁止** `--force`；**禁止** force push 到 `main`。
- 被 lease 拒絕代表遠端又有新 commit：回到 Step 1 重新抓取、rebase。
- 因權限被拒（403）：回報帳號與權限，不要改 remote、不要換帳號，改提供網頁連結。

## Step 7：開 PR

先確認該分支是否已有 PR：`gh pr view --json url,state 2>/dev/null`。已有就只更新（push 即可），回報既有 PR 連結。

沒有則建立，body 用 heredoc：

```bash
gh pr create --base main --head <branch> --title "<type>: <title>" --body "$(cat <<'EOF'
## Summary
- 一到三點，說明這個 PR 做了什麼、為什麼

## Changes
- 依模組列出主要改動（檔案或功能層級）

## Testing
- [ ] `npm run lint`（結果）
- [ ] `npm test`（幾項通過）
- [ ] `npm run build`
- [ ] `npm run test:e2e`（跑了／沒跑與原因）
- [ ] 瀏覽器手動驗證（`npm run dev`；做過才勾，沒做明說）

## Notes
- 風險、需 reviewer 特別看的地方、素材來源與授權、後續待辦（沒有就省略此節）
- merge 到 `main` 會自動部署到 GitHub Pages

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- PR 標題與 commit 標題一致（英文）；PR 內文也用英文，專案內的中文字串照原文引用。
- 「Testing」欄只寫實際做過的事，不要虛報。
- 完成後回報：PR 連結、分支、commit SHA、rebase 時吸收了幾個別人的 commit、CI 狀態（`gh pr checks`，剛開時可能還在跑）。

## 禁止事項

- 不在 `main` 直接 commit／push。
- 不在本地 `git merge` 或 `git pull`（會產生 merge commit）；同步只用 `fetch` + `rebase`。
- 不在已合併或屬於其他功能的分支上疊新 commit；新功能一律新分支、新 PR。
- 開 PR 前沒有 rebase 到最新 `origin/main` 就不能 push／開 PR。
- lint、測試或建置失敗時不 commit、不 push（除非使用者看過失敗原因後明確要求）。
- 不使用 `--force`、`--no-verify`、`git reset --hard`、`git clean` 等會丟失工作的指令（除非使用者明確要求）。
- 不修改 git config、不切換 `gh` 登入帳號。
- Step 4 的確認之前不 commit、不 push。
