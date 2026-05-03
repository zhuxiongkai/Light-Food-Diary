# 前端说明

前端位于项目根目录，使用 Vue 3、TypeScript 和 Vite 构建。

## 技术栈

- Vue 3 `<script setup>`
- TypeScript
- Vite
- Pinia
- Vue Router
- Vant
- ECharts
- vue-echarts
- Capacitor

## 路由

路由使用 `createWebHashHistory`。

| Path | Name | View | Auth | Tab |
|------|------|------|------|-----|
| `/login` | login | Login.vue | 否 | - |
| `/register` | register | Register.vue | 否 | - |
| `/guest` | guest | GuestExperience.vue | 否 | - |
| `/` | dashboard | Dashboard.vue | 是 | 概览 |
| `/log` | log | LogMeal.vue | 是 | 记录 |
| `/ai-photo` | ai-photo | AiPhoto.vue | 是 | - |
| `/statistics` | statistics | Statistics.vue | 是 | 统计 |
| `/weight` | weight | WeightLog.vue | 是 | - |
| `/settings` | settings | Settings.vue | 是 | 设置 |
| `/food-db` | food-db | FoodDatabase.vue | 是 | - |

路由守卫规则：

- 未登录访问受保护页面时跳转到 `/login`
- 已登录访问 `/guest` 时跳转到 `/`
- 登录、注册、游客页不展示底部 TabBar

## 状态管理

项目使用 Pinia 管理状态。

| Store | 说明 |
|------|------|
| `useAuthStore` | 登录、注册、登出、Token 和用户信息 |
| `useMealStore` | 当日餐食记录和营养汇总 |
| `useFoodStore` | 食物搜索、自定义食物管理 |
| `useWeightStore` | 体重记录管理 |
| `useSettingsStore` | 用户设置 |
| `useTemplateStore` | 餐食模板管理 |

## API 客户端

前端 API 客户端位于：

```txt
src/api/client.ts
```

职责：

- 统一拼接 API 地址
- 自动携带 access token
- 处理后端统一响应格式
- 遇到 401 自动刷新 token
- 刷新失败时清理登录状态

## 主题系统

主题逻辑位于：

```txt
src/composables/useTheme.ts
```

支持三种模式：

- `light`
- `dark`
- `system`

主题偏好存储在 localStorage：

```txt
app-theme
```

最终通过 `<html data-theme="...">` 控制 CSS 变量。

暗色模式变量定义在：

```txt
src/assets/styles/main.css
```

## UI 约定

- UI 文案使用中文
- 热量单位使用千卡 `kcal`
- 日期格式统一 `YYYY-MM-DD`
- 移动端优先
- Vant 组件按需引入
- 图表按需使用 ECharts，不进行全局注册
- 工具函数放在 `src/utils/`，如 `aiService.ts`（AI 识别）、`servingSize.ts`（份量配置）、`exportService.ts`（数据导出）、`renderMarkdown.ts`（Markdown 渲染）

## Capacitor

项目当前只考虑 Android。

关键配置：

- appId: `com.calorie.tracker`
- 构建输出目录：`dist/`
- Capacitor `webDir` 指向 `dist/`

常用流程：

```bash
npm run build
npx cap sync android
npx cap open android
```

