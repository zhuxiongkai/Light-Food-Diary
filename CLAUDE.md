# 热量助手 — Project Context

热量摄入追踪移动应用，面向中文用户。Vue 3 + Capacitor (Android)。

## 技术栈

- Vue 3 `<script setup>` + TypeScript 6.x
- Vite 8 (dev server `0.0.0.0:5173`, `@` alias → `src/`)
- Pinia 3 (Composition API stores)
- Vue Router 4 (createWebHashHistory)
- Vant 4 (mobile UI, on-demand import)
- Dexie 4 (IndexedDB wrapper, db name: `CalorieTrackerDB`)
- ECharts 6 + vue-echarts 8
- Capacitor 8 (appId: `com.calorie.tracker`, Android only for now)

## 路由表

| Path | Name | View | Tab |
|------|------|------|-----|
| `/` | dashboard | Dashboard.vue | 概览 |
| `/log` | log | LogMeal.vue | 记录 |
| `/ai-photo` | ai-photo | AiPhoto.vue | AI识别 |
| `/statistics` | statistics | Statistics.vue | 统计 |
| `/weight` | weight | WeightLog.vue | — |
| `/settings` | settings | Settings.vue | 设置 |
| `/food-db` | food-db | FoodDatabase.vue | — |

底部 TabBar 只有 5 个固定入口。`/weight` 和 `/food-db` 通过页面内导航进入。

## 数据模型 (Dexie)

```typescript
// 4 张表，version 1
meals:         '++id, date, mealType, foodId'
customFoods:   '++id, name, category'
weightRecords: '++id, date'
userSettings:  '++id'
```

关键类型见 `src/types/index.ts`：`FoodItem`, `MealRecord`, `WeightRecord`, `UserSettings`, `AiRecognitionResult`。

## Pinia Stores

- **useMealStore** — 当日饮食记录 CRUD，计算 `dailyCalories/dailyProtein/dailyFat/dailyCarbs`，支持按餐别查询和日期范围查询
- **useFoodStore** — 内置食物 + 自定义食物搜索和管理
- **useWeightStore** — 体重记录 CRUD
- **useSettingsStore** — 用户设置（热量目标、营养素比例、身体数据），API Key 存 localStorage

## AI 服务

- `src/utils/aiService.ts` — 调用 Claude Vision API
- 模型：`claude-haiku-4-5-20251001`，max_tokens 1024
- API Key 由用户在设置页输入，存在 `localStorage('ai_api_key')`
- 用户可随时在设置页查看/修改 API Key
- 支持 base64 图片传入，返回 `AiRecognitionResult[]`

## 内置食物库

`src/data/foodDatabase.ts` — 200+ 种中文食物和常见菜品，按分类：
主食(30) · 肉类/水产/蛋(60+) · 蔬菜/豆制品(38) · 水果(28) · 零食(25) · 饮品(20) · 家常菜(30)

## 重要约定

- UI 语言为中文
- 热量单位使用千卡 (kcal)
- 日期格式统一 `YYYY-MM-DD`
- 不使用 `vue-echarts` 的全局注册，按需引入
- Capacitor plugin 权限提示语为中文
- 构建输出目录 `dist/`，Capacitor `webDir` 指向它
