<template>
  <div class="guest-page">
    <div class="hero-card">
      <img src="/app-logo.png" alt="轻卡记" class="logo" />
      <h1>欢迎体验轻卡记</h1>
      <p>你正在查看游客演示模式。登录后可同步数据、保存历史记录并使用完整功能。</p>
    </div>

    <section class="feature-list">
      <article class="feature-card">
        <h2>今日示例</h2>
        <p>早餐 420 kcal · 午餐 610 kcal · 晚餐 530 kcal · 加餐 130 kcal</p>
      </article>
      <article class="feature-card">
        <h2>营养建议</h2>
        <p>优先补充蛋白质，适度控制脂肪，保持碳水来源均衡。</p>
      </article>
      <article class="feature-card">
        <h2>立即开始</h2>
        <p>注册账号后可保存数据并使用 AI 识别、统计分析与体重追踪。</p>
      </article>
    </section>

    <div class="actions">
      <van-button block type="primary" @click="$router.replace('/login')">返回登录</van-button>
      <van-button block plain type="primary" @click="$router.replace('/register')">注册新账号</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from 'vant'
</script>

<style scoped>
.guest-page {
  min-height: 100%;
  padding: calc(env(safe-area-inset-top, 0px) + 20px) 16px 24px;
  background:
    radial-gradient(92% 58% at 100% 0%, rgba(29, 185, 117, 0.16) 0, rgba(29, 185, 117, 0) 62%),
    linear-gradient(180deg, #f7fbfc 0%, #eef6f3 100%);
}

.hero-card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 16px;
  padding: 20px 16px;
  box-shadow: 0 8px 24px rgba(41, 74, 95, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.95);
  text-align: center;
}

.logo {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  margin-bottom: 10px;
}

.hero-card h1 {
  margin: 0;
  font-size: 24px;
  color: #0f1925;
}

.hero-card p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #667487;
}

.feature-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(129, 148, 170, 0.12);
}

.feature-card h2 {
  margin: 0;
  font-size: 15px;
  color: #122031;
}

.feature-card p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6b7a8f;
  line-height: 1.5;
}

.actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
