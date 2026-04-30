<template>
  <div class="app-shell">
    <AppNav v-if="showNav" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'

const route = useRoute()
const showNav = computed(() => !route.meta.guest)
</script>

<style>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
