<template>
  <div class="app-shell">
    <router-view />
    <AppNav />
  </div>
</template>

<script setup lang="ts">
import AppNav from '@/components/AppNav.vue'
</script>

<style>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
