<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item icon="home-o" to="/">概览</van-tabbar-item>
    <van-tabbar-item icon="add-o" to="/log">记录</van-tabbar-item>
    <van-tabbar-item icon="photograph" to="/ai-photo">AI识别</van-tabbar-item>
    <van-tabbar-item icon="chart-trending-o" to="/statistics">统计</van-tabbar-item>
    <van-tabbar-item icon="setting-o" to="/settings">设置</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tabbar, TabbarItem } from 'vant'

const active = ref(0)
</script>
