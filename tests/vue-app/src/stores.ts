import { defineEntityStore } from '@entity-store/pinia'
import { computed, ref } from 'vue'

export interface Todo {
  id: number
  title: string
  done: boolean
}

export const useTodos = defineEntityStore<Todo>()('todos', {
  extend: (base) => {
    const filter = ref<'all' | 'open'>('all')
    const visible = computed(() =>
      base.getWhereArray((t) => filter.value === 'all' || !t.done, {
        orderBy: 'title',
      }),
    )
    return { filter, visible }
  },
})
