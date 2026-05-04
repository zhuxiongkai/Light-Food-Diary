import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installFocusReinput } from './utils/focusReinput'
import { registerServiceWorker } from './utils/pwa'
import 'vant/lib/index.css'
import 'vant/lib/toast/style'
import 'vant/lib/dialog/style'
import './assets/styles/main.css'

// Apply theme synchronously before mount to prevent flash
const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null
const effective = savedTheme === 'dark'
  ? 'dark'
  : savedTheme === 'light'
    ? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
document.documentElement.setAttribute('data-theme', effective)

const app = createApp(App)
app.use(createPinia())
app.use(router)
installFocusReinput()
app.mount('#app')
registerServiceWorker()
