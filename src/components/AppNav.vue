<template>
  <nav class="app-nav" aria-label="底部导航">
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <span class="nav-icon">
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
  height: calc(68px + var(--safe-bottom));
  padding: 6px 16px calc(6px + var(--safe-bottom));
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(156, 142, 132, 0.12);
  box-shadow: 0 -2px 20px rgba(44, 36, 32, 0.06);
  backdrop-filter: blur(16px);
}

.nav-item {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 3px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  transition: color 0.25s ease, transform 0.2s ease;
}

.nav-item:active {
  transform: scale(0.94);
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 22px;
  color: var(--text-secondary);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item.active {
  color: var(--primary);
  font-weight: 650;
}

.nav-item.active .nav-icon {
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 12px;
  transform: translateY(-1px);
}

/* Active indicator dot */
.nav-item.active::after {
  content: '';
  position: absolute;
  top: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.7;
}
</style>
