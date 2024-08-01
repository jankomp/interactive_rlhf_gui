import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

//set feedback type to 'pairwise' or 'group'
app.config.globalProperties.$feedback = 'group'

app.mount('#app')
