# 数据库设计

项目使用 MySQL / MariaDB 作为主数据库，通过 Drizzle ORM 管理 schema。

Schema 定义文件：

```txt
server/src/db/schema.ts
```

## 数据表

系统共有 8 张表：

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `user_settings` | 用户设置 |
| `foods` | 食物库 |
| `meal_records` | 餐食记录 |
| `meal_templates` | 餐食模板 |
| `weight_records` | 体重记录 |
| `refresh_tokens` | 刷新令牌 |
| `email_verification_codes` | 邮箱验证码 |

## foods

存储食物营养数据。

规则：

- `user_id = NULL` 表示内置食物，所有用户共享
- `user_id = 当前用户 ID` 表示用户自定义食物
- 自定义食物只能由创建者查看、修改和删除

营养数据通常包含：

- 食物名称
- 分类
- 每 100g 热量
- 每 100g 蛋白质
- 每 100g 脂肪
- 每 100g 碳水

## meal_records

存储用户每日餐食记录。

每条记录关联：

- 用户
- 食物
- 日期
- 餐食类型
- 重量或份量
- 热量
- 蛋白质
- 脂肪
- 碳水

餐食记录用于计算每日营养汇总和统计趋势。

## meal_templates

存储餐食模板。

`foods` 字段使用 JSON 字符串保存模板中的完整食物营养数据。

这样在应用模板时，不需要再次查询食物库，可以直接批量生成餐食记录。

## weight_records

存储体重记录。

主要内容：

- 用户 ID
- 日期
- 体重
- 创建时间

用于体重趋势展示。

## refresh_tokens

存储刷新令牌。

用途：

- 支持 access token 过期后的自动刷新
- 支持登录状态续期
- 支持登出或失效控制

## email_verification_codes

存储邮箱验证码。

用途：

- 注册时发送邮箱验证码
- 验证码哈希存储，带过期时间和尝试次数限制
- 支持按邮箱 + 用途查询最新验证码

## 内置食物库

前端静态食物数据位于：

```txt
src/data/foodDatabase.ts
```

服务端种子数据位于：

```txt
server/src/data/seedFoods.ts
```

导入命令：

```bash
cd server
npm run db:seed
```

## 数据隔离原则

所有业务表都必须按 `user_id` 隔离。

用户只能访问自己的：

- 设置
- 餐食记录
- 体重记录
- 餐食模板
- 自定义食物

内置食物为公共数据，所有用户可搜索和使用。

