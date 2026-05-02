import { ref, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'app-theme'
const DATA_ATTR = 'data-theme'

const currentMode = ref<ThemeMode>(
  (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system'
)

function resolveEffective(): 'light' | 'dark' {
  if (currentMode.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return currentMode.value
}

function applyTheme(effective: 'light' | 'dark') {
  document.documentElement.setAttribute(DATA_ATTR, effective)
}

watchEffect(() => {
  applyTheme(resolveEffective())
})

const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (currentMode.value === 'system') {
    applyTheme(resolveEffective())
  }
})

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    currentMode.value = mode
    localStorage.setItem(THEME_KEY, mode)
  }

  return {
    currentMode,
    effectiveTheme: () => resolveEffective(),
    setTheme,
  }
}
