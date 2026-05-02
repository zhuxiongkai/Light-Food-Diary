import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installFocusReinput } from './utils/focusReinput'
import 'vant/lib/index.css'
import 'vant/lib/toast/style'
import 'vant/lib/dialog/style'
import './assets/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
installFocusReinput()
app.mount('#app')
