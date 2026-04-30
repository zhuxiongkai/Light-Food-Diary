import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '今日概览' }
    },
    {
      path: '/log',
      name: 'log',
      component: () => import('@/views/LogMeal.vue'),
      meta: { title: '记录饮食' }
    },
    {
      path: '/ai-photo',
      name: 'ai-photo',
      component: () => import('@/views/AiPhoto.vue'),
      meta: { title: 'AI拍照' }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/Statistics.vue'),
      meta: { title: '统计' }
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('@/views/WeightLog.vue'),
      meta: { title: '体重' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置' }
    },
    {
      path: '/food-db',
      name: 'food-db',
      component: () => import('@/views/FoodDatabase.vue'),
      meta: { title: '食物库' }
    }
  ]
})

export default router
