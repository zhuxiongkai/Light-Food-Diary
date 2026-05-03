  轻卡记 待完善功能清单（按优先级）

  P0 — 安全与基础体验 🔴

  1. Token 改用安全存储

  问题: access_token / refresh_token 直接存 localStorage，移动端有 XSS 风险。
  方案:
  - 安装 @capacitor/preferences，用 Preferences.set({ key, value }) 替代 localStorage
  - 修改 src/api/client.ts 中的 getTokens() / setTokens() / clearTokens()
  - Preferences API 在 Android 使用 SharedPreferences，iOS 使用 NSUserDefaults，均支持加密

  2. 忘记密码流程

  问题: Login.vue:36 按钮 disabled，标签"暂不可用"。后端无对应 API。
  方案:
  - POST /api/auth/forgot-password — 接收邮箱，生成 reset token(有效期15min)，用 nodemailer 发送重置链接
  - POST /api/auth/reset-password — 验证 token + 新密码，完成重置
  - 前端新增 ForgotPassword.vue、ResetPassword.vue 两个页面

  3. 修改密码 & 注销账号

  问题: 设置页仅有"登出"，缺改密和销号。
  方案:
  - PUT /api/auth/password — 旧密码 + 新密码，验证后更新
  - DELETE /api/auth/account — 确认后级联删除用户所有数据
  - Settings.vue 新增两个按钮入口

  4. API 限流 & 后端加固

  问题: 无速率限制，登录接口可被暴力破解。
  方案:
  - npm i express-rate-limit，对 /api/auth/login 和 /api/auth/register 严格限制（如 5次/IP/15min）
  - 登录失败延迟响应（已有 bcrypt，天然慢，但可加递增延迟）
  - 全局 API 设宽松限制 100次/分钟

  ---
  P1 — 核心功能补全 🟠

  5. 离线支持（当前最大短板）

  问题: 无网络时 App 白屏，Dexie.js 已安装但从未使用。
  方案:
  - 用 Dexie.js 建 IndexedDB 缓存层：foods 表全量缓存(仅236条)，meals 表离线写入
  - API client 增加 Network First 策略：在线请求 → 写入本地；离线直接读本地
  - 饮食记录和体重记录离线队列，恢复网络后批量同步
  - Capacitor @capacitor/network 监听网络状态变化

  6. Capacitor 原生能力接入

  问题: AiPhoto.vue 使用浏览器 getUserMedia 而非 @capacitor/camera；Filesystem 插件已配置但从未调用。
  方案:
  - Camera: Camera.getPhoto({ source: CameraSource.Camera }) 替代 getUserMedia
  - Filesystem: 导出功能使用 Filesystem.writeFile() 保存到设备
  - 拍照体验将从 Web 拍照升级为原生相机（启动更快、权限更合规）

  7. 条码扫描录入

  问题: LogMeal.vue:67 "扫码录入" disabled 标签"规划中"。
  方案:
  - @capacitor-mlkit/barcode-scanning 插件实现原生扫码（Capacitor 官方推荐）
  - 降级方案：html5-qrcode 纯前端库，兼容性更好
  - 扫描到条码后，调用中国物品编码中心公开数据 API 获取食品信息，自动填充

  8. 常用食物 / 智能推荐

  问题: 每次添加食物需全库搜索，无快捷入口。
  方案:
  - 后端 user_food_frequency 记录用户添加每种食物的次数
  - 记录页顶部增加"最近常吃"横向滑动栏（Top 8）
  - 纯前端也可以：在 mealStore 中统计最近 30 天食物频次，排序展示

  ---
  P2 — 体验增强 🟡

  9. 身体数据可编辑 ✅ 已完成 (2026-05-03)

  10. 餐食模板 / 组合食物 ✅ 已完成 (2026-05-03)

  11. 数据导出入口

  问题: src/utils/exportService.ts 已完整实现 exportToJSON() 和 exportToCSV()，但所有页面均未引用！
  方案:
  - Settings.vue 增加"导出数据"按钮
  - 调用 exportService，生成 CSV/JSON
  - 使用 Capacitor Filesystem 写入文件 + Share 分享

  12. 饮水追踪

  问题: 完全没有饮水记录功能。
  方案:
  - 后端 water_records 表：id, user_id, date, amount_ml, created_at
  - Dashboard 增加饮水环形进度（默认目标 2000ml/天）
  - 快速添加：+200ml / +300ml / +500ml 按钮
  - Settings 中可调整每日饮水目标

  13. 热力提醒 & 连续达标

  问题: 无推送通知，无达标激励。
  方案:
  - @capacitor/local-notifications 实现本地通知
  - Settings 增加餐食提醒开关（早/午/晚 可设时间）
  - Dashboard 显示"连续达标天数"(streak) — 纯前端基于 meal 记录计算
  - 简单的徽章：连续7天达标、体重下降1kg 等

  ---
  P3 — 智能化 🟢

  14. AI 营养建议 ✅

  问题: Dashboard 小贴士为固定文案，Statistics 有图表无解读。
  方案:
  - POST /api/ai/advice — 服务端汇总近 7 天数据，调用 DeepSeek Chat API 生成建议（DEEPSEEK_API_KEY）
  - 分析维度：蛋白质摄入是否充足、碳脂比是否合理、摄入趋势是改善还是恶化
  - Statistics 底部「AI 饮食建议」卡片（手动触发生成）

  15. 运动消耗记录

  问题: 仅有摄入端，无消耗端，"净热量"概念缺失。
  方案:
  - 新增 exercise_records 表 + 运动类型预设(跑步、走路、骑行、游泳等)
  - Dashboard 显示"净热量 = 摄入 - 运动消耗"
  - 可选：Apple Health / Google Fit 集成自动同步步数和运动数据（P4）

  16. 用户引导 & 新功能发现 ✅ 已完成 (2026-05-03)

  问题: 注册后直接跳首页，新用户不知道先设置目标还是先记餐；老用户也缺少重新查看核心流程的入口。
  方案:
  - 首次进入登录态页面时按用户 ID 判断是否完成过引导，未完成则弹出 3 步底部引导
  - 第 1 步设置每日热量目标，提供常用目标快捷项并保存到用户设置
  - 第 2 步设置当前体重与目标体重，保存后作为后续体重目标进度的基准
  - 第 3 步选择第一餐餐别，点击后跳转到饮食记录页并打开对应餐别
  - 用户完成或跳过后在本机按用户 ID 记住，不再重复打扰；设置页保留"新手引导"入口用于重新查看
  - 验收: 首次注册/登录后能看到引导；保存目标会更新 Settings/Dashboard 使用的设置；"添加第一餐"能跳转到 `/log?meal=...`；设置页可重新打开引导

  ---
  P4 — 工程化 🔵

  17. iOS 支持

  问题: Capacitor 仅配置 Android。
  方案: npx cap add ios → Xcode 配置 → 适配 iOS Safe Area（已有部分 CSS 变量）

  18. 自动化测试

  问题: 项目零测试。
  方案:
  - 后端：Vitest + supertest 覆盖 auth / meals / weight API
  - 前端：Vitest + @vue/test-utils 覆盖 macro 计算、登录表单校验
  - 优先覆盖 auth 流程和 meal CRUD

  19. 暗色模式 ✅ 已完成 (2026-05-03)

  20. 清理未使用代码

  问题: MacroBar.vue、MealCard.vue 两个组件在任何页面中未引用；Dashboard/Statistics 中被注释的头像按钮代码可以清理。

  ---
  总计 20 项。 P0 安全项应立即处理，P1 决定了 App 能否脱离浏览器独立运行（离线+原生能力），P2
  决定用户体验能否追上同类产品，P3/P4 是差异化竞争力和工程质量。
