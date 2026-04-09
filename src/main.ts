import { createApp } from 'vue'
import { createPinia } from 'pinia'

import AppRoot from './app/AppRoot.vue'
import router from './app/router'
import './style.css'

const app = createApp(AppRoot)

app.use(createPinia())
app.use(router)

app.mount('#app')
