<template>
  <nav class="app-nav" aria-label="底部导航">
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <span class="nav-icon" :class="{ raised: item.to === '/log' }">
        <van-icon :name="item.icon" />
      </span>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from 'vant'

const route = useRoute()

const navItems = [
  { label: '首页', to: '/', icon: 'wap-home-o' },
  { label: '记录', to: '/log', icon: 'add-square' },
  { label: '统计', to: '/statistics', icon: 'bar-chart-o' },
  { label: '我的', to: '/settings', icon: 'user-o' }
]

const currentPath = computed(() => route.path)

function isActive(path: string) {
  return path === '/' ? currentPath.value === '/' : currentPath.value.startsWith(path)
}
</script>

<style scoped>
.app-nav {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(70px + var(--safe-bottom));
  padding: 8px 16px calc(8px + var(--safe-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid rgba(132, 149, 171, 0.08);
  box-shadow: 0 -4px 16px rgba(44, 70, 103, 0.08);
  backdrop-filter: blur(12px);
}

.nav-item {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 22px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.nav-icon.raised {
  color: white;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-strong) 100%);
  box-shadow: 0 8px 20px rgba(22, 185, 120, 0.3);
  font-size: 20px;
}

.nav-item.active {
  color: var(--primary);
  font-weight: 600;
}

.nav-item.active .nav-icon:not(.raised) {
  color: var(--primary);
  background: var(--primary-soft);
}
</style>
