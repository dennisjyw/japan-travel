# 旅遊行程看板渲染器 (Notion Based) PRD

## 1. 專案概述 (Overview)
**Notion Journey** 是一個將 Notion 轉化為精美旅遊行程 App 的極簡解決方案。專為旅行者設計，解決傳統旅遊手冊難以在手機閱讀、Notion 原生介面過於單調的問題。

- **極簡配置**: 0 程式碼基礎也能使用，只需提供 Notion API Key 與 Database ID。
- **極致體驗**: 專為移動端打造的 Premium 玻璃擬態介面，不僅是行程表，更是隨身的旅遊嚮導。
- **動態同步**: 所有內容在 Notion 修改即時更新，無須重新部署。
- **隱私優先**: 內建密碼保護機制，確保私人行程不外洩。

## 2. 核心功能需求 (Functional Requirements)

### 2.1 Notion 資料綁定與對應
- **動態切換**: 透過環境變數設定 `NOTION_API_KEY` 與 `NOTION_DATABASE_ID`。
- **資料分層 (基於 `type` 欄位)**:
    - **配置型資料 (`type: config`)**: 讀取 `config` 欄位。定義 `country` (目的地國家/標題)、`city` (城市)、`gmt` (時差)、`exchange` (目標幣別)、`password` (網站存取密碼)。
    - **行程型資料 (`type: journey`)**: 讀取 `journey` 欄位。分類包括：`transport` (交通), `visit` (景點), `hotel` (住宿), `restaurant` (餐廳), `shopping` (購物)。

### 2.2 介面功能 (UI Features)
- **Top Bar (固定 玻璃擬態)**:
    - **標題**: 格式為 「國家 - 城市」 (e.g., "日本 - 京都&大阪")。
    - **日期**: 顯示旅遊日期範圍。
    - **視覺優化**: 採用漸層背景與 iOS 風格排版。
- **分日行程列表 (Group by Day)**:
    - **自動分組**: 根據日期自動計算「Day 1, Day 2...」並進行區分。
    - **日期標題**: 每個分組上方顯示日期與星期 (e.g., "10/16 (Wed)")。
- **底部導航選單 (6 Tabs 固定)**:
    - **行程**: 依照時間軸分日排列的活動。
    - **首頁 / 景點 / 住宿 / 交通 / 資訊**: 各自過濾對應分類顯示（開發中）。
        - **首頁**:
            - 判斷當天日期，如果非活動當天日期，以每一天為一個卡片做收折顯示，使用者可以點擊卡片展開該日的行程。
            - 如果是活動當天日期，則顯示該日的行程，用時間軸的方式展示，同時需要偵測當時的時間點，過去時間的行程降低顯示飽和度。
            - 首頁有下拉選單用於選擇日期，預設是活動當天日期，使用者選擇其他日期則顯示指定日期的行程。
            - **當地時間**: 優化 Widget 載入速度，消除初始延遲。
        - **景點**:
            - 包含景點、餐廳、購物，按照分類展示。
            - 以時間作為排序，時間越近的行程越前面。，過去時間的行程降低顯示飽和度。
        - **住宿**:
            - 需要顯示住宿地點的照片。
        - **交通**:
        - **資訊**:
            - **內容來源**: 讀取 Notion Database 中 `type=config` 且 `config=info` 的 Page 內容。
            - **呈現方式**: 直接顯示 Page 內的 Block 內容，移除預設的「緊急資訊」標題。
            - **地址優化**: 若內容包含「地址」，顯示純文字（去除超連結樣式），並在後方加入「導航按鈕」連結至地圖。
            - **電話優化**: 若內容包含「電話」（一般/緊急），在後方加入「通話按鈕」，支援一鍵撥打。
- **卡片展示**: type 為 journey 的資料所有展示形式預設相同。
- **匯率換算器**:
    - 置頂於行程頁，方便根據 `exchange` 設定即時參考，需要連動即時匯率。
- **地圖與導航**:
    - 點擊 `maps` 連結自動喚起導航（優先支援 Google/Apple Maps）。

### 2.3 渲染器細節
- **時間軸卡片**: 針對不同 `journey` 分類提供專屬 Premium 圖示。
- **Cover Image**: 讀取 Notion 頁面的 **Cover Image**。若有封面則以大圖顯示，無封面則自動縮小卡片高度。
- **本地時間固定與時區校正**: 
    - 忽略 Notion API 回傳的時區偏移量。
    - 強制將 Notion 輸入的日期時間字串 (ISO 8601) 解析為**目的地當地時間 (Destination Local Time)**。
    - 確保在任何時區瀏覽網頁時，行程時間均顯示為當地時間 (例如輸入 10:00 即顯示 10:00)，避免因瀏覽器時區不同而產生日期或時間誤差。

### 2.4 行程隱私保護 (Privacy & Auth)
- **密碼登入機制**:
    - 在 Database `config` 增加 `password` 設定網站存取密碼 (4位數)。
    - 雖是靜態網站渲染，但在進入主頁面 (**Root Layout**) 前需通過 **Server Action** 驗證。
    - **驗證流程**:
        1. 使用者開啟網站，若無有效 Cookie，顯示全螢幕密碼輸入框 (**PasswordProtection**)。
        2. 輸入密碼後，透過 Server Action 比對 Notion Config 中的密碼。
        3. 驗證成功寫入 `httpOnly` Cookie (`journey_auth`)，有效期 7 天，並設定 `SameSite=Lax` 以確保體驗流暢。
        4. 驗證通過後，Layout 才會渲染 `children` (行程內容)，確保資料隱私。
    - **登出/過期**: Cookie 到期 (7天) 或手動清除後，需重新輸入密碼。重整頁面 (F5) 不會導致登出。

## 3. Notion Database 欄位架構 (Schema)
1.  **title**: 標題 (Title)
2.  **type**: 資料大類 (Select: `config`, `journey`)
3.  **config**: 配置細項 (Select: `country`, `city`, `exchange`, `gmt`, `password`, `info`) - *僅當 type 為 config 時有效*
4.  **journey**: 行程分類 (Select: `transport`, `hotel`, `visit`, `restaurant`, `shopping`) - *僅當 type 為 journey 時有效*
5.  **date**: 時間 (Date with time)
6.  **maps**: 地點連結 (URL)
7.  **Cover**: 使用 Notion 內建封面圖 (Page Cover)

## 4. 技術規格 (Technical Specifications)
- **框架**: Next.js (App Router)。
- **樣式**: shadcn/ui + Vanilla CSS (Premium 玻璃擬態、動態效果) + TailwindCSS。
- **安全性**: 使用 `/api/notion` 代理所有 Notion 請求。
- **部署**: 支援 Zeabur / Vercel 一鍵部署。

## 5. 部署與極簡配置 (Deployment)
- **零程式碼修改**: 使用者只需設定環境變數即可完成配置。
- **自動化渲染**: 系統自動解析 `type` 與對應屬性，產出分組後的行程看板。
- **靜態資源**: 支援客製化永久 Favicon 與 App Icon。