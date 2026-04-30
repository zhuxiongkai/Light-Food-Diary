# 热量助手

一个基于 Vue 3 的移动端热量追踪应用，支持 Android 平台（通过 Capacitor）。

## 功能

- **饮食记录** — 按早/午/晚/加餐记录每餐食物，自动计算热量和营养素
- **AI 拍照识别** — 使用 Claude Vision API 拍摄食物照片自动识别并估算热量
- **食物库** — 内置 200+ 种常见中国食物和菜品，支持自定义添加
- **热量仪表盘** — 环形进度条实时显示当日热量摄入，支持查看历史日
- **三大营养素追踪** — 蛋白质/脂肪/碳水摄入可视化
- **体重记录** — 记录和查看体重变化趋势
- **数据统计** — ECharts 图表展示热量和体重变化趋势
- **数据导出** — 支持导出为 JSON / CSV

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router (hash mode) |
| UI 组件 | Vant 4 |
| 本地数据库 | Dexie (IndexedDB) |
| 图表 | ECharts + vue-echarts |
| 移动端 | Capacitor 8 (Android) |
| AI 识别 | Claude Vision API (Haiku 4.5) |

## 开发

```bash
npm install
npm run dev        # 启动开发服务器 (http://localhost:5173)
npm run build      # 构建生产版本到 dist/
npm run preview    # 预览生产构建
```

## Android 构建

```bash
npm run cap:sync           # 同步 web 代码到 android
npm run cap:open:android   # 在 Android Studio 中打开
```

## 项目结构

```
src/
  main.ts              # 入口：挂载 Vue + Pinia + Router
  App.vue              # 根组件：router-view + 底部导航
  router/index.ts      # 路由配置 (6 页面)
  db/index.ts          # Dexie 数据库定义 (4 张表)
  types/index.ts       # TypeScript 类型定义
  data/foodDatabase.ts # 内置食物数据库
  stores/              # Pinia stores
    foodStore.ts       # 食物搜索/自定义食物 CRUD
    mealStore.ts       # 饮食记录 CRUD + 每日统计
    weightStore.ts     # 体重记录 CRUD
    settingsStore.ts   # 用户设置 + API Key 管理
  views/               # 页面组件
  components/          # 可复用组件
  utils/
    aiService.ts       # Claude Vision API 封装
    exportService.ts   # JSON/CSV 导出
```

## 环境要求

- Node.js >= 18
- 可选：Android Studio（用于 Android 构建）
- 可选：Anthropic API Key（用于 AI 拍照识别功能，在设置页配置）
