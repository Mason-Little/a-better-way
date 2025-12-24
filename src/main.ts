import { createApp } from 'vue'
import { createPinia } from 'pinia'


import { TomTomConfig } from '@tomtom-org/maps-sdk/core'

TomTomConfig.instance.put({
  apiKey: import.meta.env.VITE_TOM_TOM_KEY,
})

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
