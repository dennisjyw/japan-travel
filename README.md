# Notion Journey ✈️

**Notion Journey** 是一個將 Notion 轉化為精美旅遊行程 App 的極簡解決方案。專為旅行者設計，解決傳統旅遊手冊難以在手機閱讀、Notion 原生介面過於單調的問題。

![App Screenshot](/public/icon-512.png) 
*(建議在此處替換為實際的 App 截圖)*

## ✨ 核心特色 (Features)

- **📱 Mobile-First 極致體驗**: 專為移動端打造的 Premium 玻璃擬態介面，支援 PWA 安裝至主畫面，提供如同原生 App 的流暢體驗。
- **🚀 極簡配置 (No-Code)**: 0 程式碼基礎也能使用，只需在環境變數設定 Notion API Key 與 Database ID。
- **🔄 動態同步**: 行程內容完全透過 Notion 管理，修改即時更新，無須重新部署網站。
- **🔒 隱私優先**: 內建 4 位數通行碼保護機制，確保私人行程不被未授權者查看。
- **🌍 智慧時區**: 自動校正當地時間，無論身在何處，行程時間永遠顯示為目的地當地時間。
- **💾 登入保持**: 通過驗證後自動保持登入狀態 7 天，重新整理頁面無需重複輸入密碼。
- **ℹ️ 智慧資訊頁**: 自動解析地址與電話，支援一鍵導航 (Google/Apple Maps) 與直接撥號。
- **💰 即時匯率**: 內建匯率換算器，即時參考當地物價。
- **🗺️ 一鍵導航**: 整合 Google/Apple Maps，點擊行程地點即刻導航。

## 🛠️ 技術棧 (Tech Stack)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Variables
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Lucide React](https://lucide.dev/)
- **Data Source**: [Notion API](https://developers.notion.com/)
- **Deployment**: Vercel / Zeabur / Docker

## 🚀 快速開始 (Getting Started)

### 1. 準備 Notion Database

請複製以下 Template 到您的 Notion Workspace：
*(在此處插入您的 Notion Template 連結，如果有的話)*

或是建立一個 Database 並包含以下欄位：
- **title** (Title): 標題
- **type** (Select): `config` 或 `journey`
- **config** (Select): `country`, `city`, `exchange`, `gmt`, `password`, `info`
- **journey** (Select): `transport`, `visit`, `hotel`, `restaurant`, `shopping`
- **date** (Date): 行程時間
- **maps** (URL): 地點連結
- **Cover**: 頁面封面圖 (用於顯示卡片大圖)

### 2. 取得 API Credentials

1. 前往 [My Integrations](https://www.notion.so/my-integrations) 建立一個新的 Integration，取得 `Internal Integration Secret` (即 API Key)。
2. 在您的 Notion Database 頁面，點擊右上角 `...` > `Connect to` > 選擇剛建立的 Integration。
3. 取得 Database ID (從 URL 中 `https://www.notion.so/myworkspace/{DATABASE_ID}?v=...` 獲取)。

### 3. 本地開發

複製範例環境變數檔並填入您的資訊：

```bash
cp .env.local.example .env.local
```

編輯 `.env.local`：

```env
NOTION_API_KEY=your_integration_secret_here
NOTION_DATABASE_ID=your_database_id_here
```

安裝依賴並啟動：

```bash
npm install
npm run dev
```

瀏覽器打開 [http://localhost:3000](http://localhost:3000) 即可看到您的行程。

## 📦 部署 (Deployment)

本專案支援一鍵部署至 Vercel 或 Zeabur。

### Vercel

1. Fork 本專案到您的 GitHub。
2. 在 Vercel 新增專案，選擇剛 Fork 的 Repository。
3. 在 **Environment Variables** 設定 `NOTION_API_KEY` 與 `NOTION_DATABASE_ID`。
4. 點擊 **Deploy**。

## 📱 PWA 安裝說明

**iOS (Safari)**:
1. 在 Safari 開啟網頁。
2. 點擊底部「分享」按鈕。
3. 選擇「加入主畫面」。

**Android (Chrome)**:
1. 在 Chrome 開啟網頁。
2. 點擊右上角選單。
3. 選擇「安裝應用程式」或「加到主畫面」。

## 📄 License

MIT
