import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useGame } from './stores/game'
import './styles/tokens.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')

// 測試掛鉤：開發模式或網址帶 ?test 時，讓 Playwright 能直接操作狀態
if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('test')) {
  ;(window as unknown as { __game: ReturnType<typeof useGame> }).__game = useGame(pinia)
}
