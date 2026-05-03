<template>
  <div class="app-shell">
    <AppNav v-if="showNav" />
    <router-view />
    <OnboardingGuide v-if="showNav" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import OnboardingGuide from '@/components/OnboardingGuide.vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()
const showNav = computed(() => !route.meta.guest)

onMounted(() => {
  if (showNav.value) {
    void authStore.init()
  }
})

watch(showNav, (visible) => {
  if (visible) {
    void authStore.init()
  }
})
</script>

<style>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Warm decorative gradient at top edge */
.app-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 2;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(180, 150, 120, 0.3) 20%,
    rgba(180, 150, 120, 0.5) 50%,
    rgba(180, 150, 120, 0.3) 80%,
    transparent
  );
}
</style>
