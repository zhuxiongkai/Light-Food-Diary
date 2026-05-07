<template>
  <span class="inline-svg-icon" aria-hidden="true" v-html="svg"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getInlineSvgIcon, type InlineSvgIconName } from '@/utils/inlineSvgIcons'

const props = defineProps<{
  name: InlineSvgIconName
}>()

const svg = computed(() => getInlineSvgIcon(props.name))
</script>

<style scoped>
.inline-svg-icon {
  display: inline-grid;
  width: 1em;
  height: 1em;
  place-items: center;
  color: currentColor;
  line-height: 1;
  vertical-align: -0.125em;
}

.inline-svg-icon :deep(svg) {
  display: block;
  width: 1em;
  height: 1em;
}
</style>
