# 常见问题

## 前端启动后接口请求失败

检查 `VITE_API_URL` 是否正确。

本地开发通常使用：

```bash
VITE_API_URL=http://localhost:3000/api npm run dev
```

如果后端端口不是 3000，需要同步修改。

## 登录后很快变成未登录

可能原因：

- access token 过期后刷新失败
- refresh token 无效
- 后端 `JWT_SECRET` 或 `JWT_REFRESH_SECRET` 改动
- 浏览器本地登录状态与后端 token 状态不一致

可以尝试退出登录后重新登录。

## 接口返回 401

401 通常表示认证失败。

检查：

- 请求头是否包含 `Authorization: Bearer <access_token>`
- access token 是否过期
- refresh token 是否可用
- 后端 JWT 配置是否正确

## 数据库连接失败

检查 `server/.env`：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=calorie_tracker
```

同时确认：

- MySQL / MariaDB 已启动
- 数据库用户和密码正确
- 数据库已创建
- 当前用户有访问权限

## 没有食物数据

首次运行需要导入内置食物库：

```bash
cd server
npm run db:seed
```

## AI 识别失败

检查后端环境变量：

```env
BAIDU_AI_API_KEY=your_baidu_api_key
BAIDU_AI_SECRET_KEY=your_baidu_secret_key
```

同时确认：

- 百度 AI 服务可用
- 图片 base64 格式正确
- 后端网络可以访问百度 AI
- 当前用户已登录

## Android 真机无法访问后端

真机不能用 `localhost` 访问电脑上的后端服务。

需要使用电脑的局域网 IP：

```env
VITE_API_URL=http://192.168.1.100:3000/api
```

并确认手机和电脑在同一个网络下。

## 暗色模式不生效

检查：

- `localStorage` 中的 `app-theme`
- `<html>` 上是否存在 `data-theme`
- `src/assets/styles/main.css` 中暗色变量是否加载
- Vant 组件变量是否映射到自定义 CSS 变量

## 日期数据不一致

项目约定日期格式统一为：

```txt
YYYY-MM-DD
```

前后端传参和数据库查询都应使用该格式。

