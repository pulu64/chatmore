import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
//引入样式文件
import '@/assets/font/iconfont.css'
import '@/assets/css/style.min1.css'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// socket

// 配置
const socketOptions = {
  autoConnect: true, // 自动连接
  transports: ['websocket'], // 指定为websocket连接
  reconnect: true,
  reconnectionAttempts: 5, // 重连次数
};
const app = createApp(App)

//pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

//注册 Element Plus Icons Vue 库中的所有图标组件到 Vue 应用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')
