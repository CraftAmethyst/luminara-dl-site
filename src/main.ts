import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

const language = document.documentElement.lang.toLowerCase()
const locale = language.startsWith('en') ? 'en' : 'zh'

createApp(App, { locale }).mount('#app')
