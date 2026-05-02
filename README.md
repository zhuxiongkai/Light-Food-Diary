# 热量助手

一个基于 Vue 3 的移动端热量追踪应用，Express 后端 + MySQL，支持 Android 平台（通过 Capacitor）。

## 功能

- **多用户** — 注册/登录，数据按用户隔离
- **饮食记录** — 按早/午/晚/加餐记录每餐食物，自动计算热量和营养素
- **AI 拍照识别** — 基于服务端统一配置的 Baidu AI 菜品识别能力，拍摄食物照片自动识别并估算热量
- **食物库** — 内置 230+ 种常见中国食物和菜品，支持自定义添加
- **热量仪表盘** — 环形进度条实时显示当日热量摄入，支持查看历史日
- **三大营养素追踪** — 蛋白质/脂肪/碳水摄入可视化
- **体重记录** — 记录和查看体重变化趋势
- **数据统计** — ECharts 图表展示热量和体重变化趋势
- **数据导出** — 支持导出为 JSON / CSV

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router (hash mode) |
| UI 组件 | Vant 4 |
| 图表 | ECharts + vue-echarts |
| 移动端 | Capacitor 8 (Android) |
| 后端 | Express 5 + TypeScript |
| 数据库 | MySQL / MariaDB |
| ORM | Drizzle ORM |
| 鉴权 | JWT (access + refresh token) |
| AI 识别 | Baidu AI 菜品识别（通过后端代理） |

## 项目结构

```
root/
  docker-compose.yml          # MySQL + 后端一键部署
  docker/mysql/init.sql       # 数据库字符集初始化
  index.html                  # 前端入口 HTML
  vite.config.ts              # Vite 配置
  src/
    main.ts                   # 入口：挂载 Vue + Pinia + Router
    App.vue                   # 根组件：router-view + 底部导航
    api/client.ts             # API 客户端（自动 Token + 401 刷新）
    router/index.ts           # 路由配置 (10 页面 + 鉴权守卫)
    types/index.ts            # TypeScript 类型定义
    data/foodDatabase.ts      # 内置食物数据库（前端离线兜底）
    stores/
      authStore.ts            # 登录/注册/Token 管理
      foodStore.ts            # 食物搜索/自定义食物 CRUD
      mealStore.ts            # 饮食记录 CRUD + 每日统计
      weightStore.ts          # 体重记录 CRUD
      settingsStore.ts        # 用户设置
    views/
      Login.vue / Register.vue / GuestExperience.vue  # 登录/注册/游客体验
      Dashboard.vue / LogMeal.vue / AiPhoto.vue / Statistics.vue
      WeightLog.vue / Settings.vue / FoodDatabase.vue
    components/               # 可复用组件
    utils/
      aiService.ts            # AI 识别（调后端代理）
      exportService.ts        # JSON/CSV 导出
  server/
    src/
      index.ts                # Express 入口
      config.ts               # 环境变量配置
      db/
        schema.ts             # Drizzle schema (6 张表)
        connection.ts         # MySQL 连接池
        migrate.ts            # 数据库迁移
        seed.ts               # 内置食物种子数据
      middleware/
        auth.ts               # JWT 鉴权中间件
        errorHandler.ts       # 全局错误处理
      routes/                 # API 路由
      services/               # 业务逻辑层
      utils/                  # 工具函数 (jwt, password, crypto)
    .env.example              # 环境变量模板
    drizzle.config.ts         # Drizzle Kit 配置
    Dockerfile                # 多阶段构建
```

## 开发

### 前置条件

- Node.js >= 18
- MySQL 8.x 或 MariaDB

### 后端启动

```bash
cd server
npm install
cp .env.example .env       # 编辑 .env 填写数据库连接信息
npx drizzle-kit generate   # 生成迁移文件
npm run db:migrate         # 创建数据库和表
npm run db:seed            # 导入 230+ 条内置食物数据
npm run dev                # 启动开发服务器 (http://localhost:3000)
```

### 前端启动

```bash
# 根目录
npm install
VITE_API_URL=http://localhost:3000/api npm run dev   # http://localhost:5173
```

### 生产构建

```bash
npm run build              # 构建前端到 dist/
cd server && npm run build # 构建后端到 dist/
```

## Docker 部署

```bash
# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填入 DB_PASSWORD, JWT_SECRET 等

# 启动
docker-compose up -d

# 初始化数据库（首次）
docker-compose exec server npm run db:migrate
docker-compose exec server npm run db:seed
```

## Android 构建

```bash
npm run cap:sync           # 同步 web 代码到 android
npm run cap:open:android   # 在 Android Studio 中打开
```

## API 概览

所有业务接口需 `Authorization: Bearer <token>`。响应格式 `{ code: 0, data, message }`。

| 模块 | 端点 |
|------|------|
| Auth | POST `/api/auth/register` `/login` `/refresh`, GET `/me` |
| 食物 | GET `/api/foods`, POST/PUT/DELETE `/api/foods/custom[/:id]` |
| 餐食 | GET `/api/meals[/range][/stats]`, POST/PUT/DELETE `/api/meals[/:id]` |
| 体重 | GET `/api/weight[/range]`, POST `/api/weight`, DELETE `/api/weight/:id` |
| 设置 | GET/PUT `/api/settings` |
| AI | POST `/api/ai/recognize` |

## 环境要求

- Node.js >= 18
- MySQL 8.x 或 MariaDB
- 可选：Android Studio（用于 Android 构建）
- 可选：Baidu AI 服务密钥（在 `server/.env` 中配置）
