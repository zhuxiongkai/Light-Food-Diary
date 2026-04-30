import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from '@/api/client'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录', guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { title: '注册', guest: true },
    },
    {
      path: '/guest',
      name: 'guest',
      component: () => import('@/views/GuestExperience.vue'),
      meta: { title: '游客体验', guest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '今日概览', requiresAuth: true },
    },
    {
      path: '/log',
      name: 'log',
      component: () => import('@/views/LogMeal.vue'),
      meta: { title: '记录饮食', requiresAuth: true },
    },
    {
      path: '/ai-photo',
      name: 'ai-photo',
      component: () => import('@/views/AiPhoto.vue'),
      meta: { title: 'AI拍照', requiresAuth: true },
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/Statistics.vue'),
      meta: { title: '统计', requiresAuth: true },
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('@/views/WeightLog.vue'),
      meta: { title: '体重', requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置', requiresAuth: true },
    },
    {
      path: '/food-db',
      name: 'food-db',
      component: () => import('@/views/FoodDatabase.vue'),
      meta: { title: '食物库', requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authed = isAuthenticated()

  if (to.meta.requiresAuth && !authed) {
    next('/login')
  } else if (to.meta.guest && authed) {
    next('/')
  } else {
    next()
  }
})

export default router
