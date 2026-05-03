# 后端 API

后端位于 `server/` 目录，使用 Express、TypeScript、Drizzle ORM 和 MySQL / MariaDB。

## 基础地址

本地默认地址：

```txt
http://localhost:3000/api
```

前端通过 `VITE_API_URL` 配置 API 地址。

## 响应格式

成功响应：

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

失败响应：

```json
{
  "code": -1,
  "message": "错误信息"
}
```

## 鉴权

除注册、登录、刷新 Token 外，业务接口都需要携带请求头：

```txt
Authorization: Bearer <access_token>
```

## API 路由

| Method | Path | 说明 |
|------|------|------|
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
| GET | `/api/meals/templates` | 餐食模板列表 |
| POST | `/api/meals/templates` | 创建模板 |
| PUT | `/api/meals/templates/:id` | 修改模板 |
| DELETE | `/api/meals/templates/:id` | 删除模板 |
| POST | `/api/meals/templates/:id/apply` | 应用模板 |

## 开发约定

- 所有业务数据必须按 `user_id` 隔离
- 接口返回统一响应格式
- 日期参数统一使用 `YYYY-MM-DD`
- 密码必须使用 bcrypt 哈希
- 不在前端保存第三方 AI 密钥

