# 轻卡记 — Project Context

热量摄入追踪移动应用，面向中文用户。Vue 3 + Capacitor (Android) + Express 后端。

## 技术栈

### 前端
- Vue 3 `<script setup>` + TypeScript 6.x
- Vite 8 (dev server `0.0.0.0:5173`, `@` alias → `src/`)
- Pinia 3 (Composition API stores)
- Vue Router 4 (createWebHashHistory)
- Vant 4 (mobile UI, on-demand import)
- ECharts 6 + vue-echarts 8
- Capacitor 8 (appId: `com.calorie.tracker`, Android only for now)

### 后端 (`server/`)
- Express 5 + TypeScript 6
- Drizzle ORM + mysql2 (MySQL/MariaDB)
- JWT (access 15min + refresh 7d)，bcrypt 密码哈希
- AI 识别采用服务端统一密钥（Baidu AI）

## 路由表

| Path | Name | View | Auth | Tab |
|------|------|------|------|-----|
| `/login` | login | Login.vue | 否 | — |
| `/register` | register | Register.vue | 否 | — |
| `/guest` | guest | GuestExperience.vue | 否 | — |
| `/` | dashboard | Dashboard.vue | 是 | 概览 |
| `/log` | log | LogMeal.vue | 是 | 记录 |
| `/ai-photo` | ai-photo | AiPhoto.vue | 是 | — |
| `/statistics` | statistics | Statistics.vue | 是 | 统计 |
| `/weight` | weight | WeightLog.vue | 是 | — |
| `/settings` | settings | Settings.vue | 是 | 设置 |
| `/food-db` | food-db | FoodDatabase.vue | 是 | — |

路由守卫：未登录 → `/login`；已登录访问 guest 页 → `/`。
底部 TabBar 4 个固定入口。`/login`、`/register`、`/guest`、`/weight`、`/food-db`、`/ai-photo` 通过页面内导航或路由进入。

## API 路由 (后端)

所有业务接口需要 `Authorization: Bearer <access_token>`。

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET | `/api/auth/me` | 当前用户 |
| GET | `/api/foods?keyword=&category=` | 搜索食物 |
| POST | `/api/foods/custom` | 添加自定义食物 |
| PUT | `/api/foods/custom/:id` | 修改自定义食物 |
| DELETE | `/api/foods/custom/:id` | 删除自定义食物 |
| GET | `/api/meals?date=YYYY-MM-DD` | 当日餐食 |
| GET | `/api/meals/range?start=&end=` | 日期范围餐食 |
| GET | `/api/meals/stats?date=` | 当日营养统计 |
| POST | `/api/meals` | 添加餐食 |
| PUT | `/api/meals/:id` | 修改餐食 |
| DELETE | `/api/meals/:id` | 删除餐食 |
| GET | `/api/weight` | 体重记录列表 |
| GET | `/api/weight/range?start=&end=` | 日期范围体重 |
| POST | `/api/weight` | 添加体重记录 |
| DELETE | `/api/weight/:id` | 删除体重记录 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |
| POST | `/api/ai/recognize` | AI 食物识别 |

响应格式统一：`{ code: 0, data: ..., message: 'ok' }` 成功；`{ code: -1, message: '错误信息' }` 失败。

## 数据模型 (MySQL, Drizzle ORM)

6 张表：`users`, `user_settings`, `foods`, `meal_records`, `weight_records`, `refresh_tokens`。

- 内置食物 `user_id = NULL`（所有用户共享）；自定义食物 `user_id` 指向创建者
- 所有业务表按 `user_id` 隔离
- `user_settings.ai_api_key` 字段仅保留兼容，当前 AI 识别不再依赖用户侧密钥

Schema 定义见 `server/src/db/schema.ts`。

## Pinia Stores

- **useAuthStore** (`src/stores/authStore.ts`) — 登录/注册/登出，Token + 用户状态管理
- **useMealStore** — 当日饮食记录 CRUD（调 API），计算 `dailyCalories/dailyProtein/dailyFat/dailyCarbs`
- **useFoodStore** — 食物搜索（调 API），自定义食物 CRUD
- **useWeightStore** — 体重记录 CRUD（调 API）
- **useSettingsStore** — 用户设置读写（调 API）

前端 API 客户端见 `src/api/client.ts`，自动带 Token + 401 自动刷新。

## AI 服务

- 前端 `src/utils/aiService.ts` → 调后端 `/api/ai/recognize`
- 后端 `server/src/services/aiService.ts` → 调用 Baidu 菜品识别 API
- 服务端统一读取 `BAIDU_AI_API_KEY` 与 `BAIDU_AI_SECRET_KEY`
- 支持 base64 图片传入，返回 `AiRecognitionResult[]`

## 内置食物库

`src/data/foodDatabase.ts` — 230+ 种中文食物和常见菜品，按分类：
主食(30) · 肉类/水产/蛋(60+) · 蔬菜/豆制品(38) · 水果(28) · 零食(25) · 饮品(20) · 家常菜(30)

服务端种子数据在 `server/src/data/seedFoods.ts`，通过 `npm run db:seed` 导入 MySQL。

## 环境变量

### 前端 (`VITE_API_URL`)
| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_URL` | `http://localhost:3000/api` | 后端 API 地址 |

### 后端 (`server/.env`)
| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口 (默认 3000) |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | MySQL 连接 |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | JWT 签名密钥 |
| `ENCRYPTION_KEY` | AI API Key 加密密钥 |
| `BAIDU_AI_API_KEY` / `BAIDU_AI_SECRET_KEY` | Baidu AI 识别服务密钥 |

## 启动流程

```bash
# 后端
cd server
npm install
cp .env.example .env   # 编辑填写数据库密码等
npm run db:migrate      # 建库建表
npm run db:seed         # 导入食物数据
npm run dev             # 启动 (http://localhost:3000)

# 前端
VITE_API_URL=http://localhost:3000/api npm run dev
```

## 重要约定

- UI 语言为中文
- 热量单位使用千卡 (kcal)
- 日期格式统一 `YYYY-MM-DD`
- 不使用 `vue-echarts` 的全局注册，按需引入
- Capacitor plugin 权限提示语为中文
- 构建输出目录 `dist/`，Capacitor `webDir` 指向它
- Dexie 保留用于离线缓存（后续迭代），当前主存储为 MySQL
