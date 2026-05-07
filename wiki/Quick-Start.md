# 快速启动

本文说明如何在本地启动轻卡记的前端、后端和数据库。

## 环境要求

- Node.js
- npm
- MySQL 或 MariaDB
- Android Studio，只有需要打包 Android 应用时才需要

## 后端启动

进入后端目录：

```bash
cd server
npm install
cp .env.example .env
```

编辑 `server/.env`：

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=calorie_tracker

JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
ENCRYPTION_KEY=replace_me

BAIDU_AI_API_KEY=your_baidu_api_key
BAIDU_AI_SECRET_KEY=your_baidu_secret_key

# DeepSeek（AI 饮食建议，可选）
DEEPSEEK_API_KEY=

# SMTP（邮箱验证码，开发环境不配则打印到日志）
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

初始化数据库：

```bash
npm run db:migrate
npm run db:seed
```

启动后端服务：

```bash
npm run dev
```

默认地址：

```txt
http://localhost:3000
```

## 前端启动

在项目根目录安装依赖：

```bash
npm install
```

启动前端开发服务：

```bash
VITE_API_URL=http://localhost:3000/api npm run dev
```

Windows PowerShell 可以使用：

```powershell
$env:VITE_API_URL="http://localhost:3000/api"
npm run dev
```

默认前端地址：

```txt
http://localhost:5173
```

## 常见启动顺序

1. 启动 MySQL / MariaDB
2. 启动后端服务
3. 启动前端 Vite 服务
4. 浏览器访问 `http://localhost:5173`

## 注意事项

- 不要把真实 `.env` 文件提交到 GitHub。
- 首次运行需要执行数据库迁移和食物库种子导入。
- 前端接口地址由 `VITE_API_URL` 控制。
- 后端业务接口需要登录后的 `Authorization: Bearer <access_token>`。

