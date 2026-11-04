import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { TodoList } from './TodoList.js'

createApp(TodoList).use(createPinia()).mount('#app')
