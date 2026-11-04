import { defineEntityStore } from '@entity-store/pinia'
import { computed, defineComponent, h } from 'vue'

interface Todo {
  id: number
  title: string
  done: boolean
}

// Plain store
export const useTodos = defineEntityStore<Todo>('todos')

// Store with your own typed getters and actions
export const useTodosWithExtras = defineEntityStore<Todo>()('todos-extra', {
  extend: (base) => {
    const remaining = computed(() => base.getByField('done', false))
    function toggle(id: number) {
      const todo = base.getOne(id)
      if (todo) base.updateField('done', !todo.done, id)
    }
    return { remaining, toggle }
  },
})

// The same component as a `<script setup>` SFC would be, written with a render
// function so that it can be type-checked without a Vue compiler.
export const TodoList = defineComponent({
  setup() {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue's setup() is the right place
    const todos = useTodosWithExtras()
    todos.createMany([
      { id: 1, title: 'Read the docs', done: false },
      { id: 2, title: 'Ship it', done: false },
    ])
    return () =>
      h(
        'ul',
        todos.getSortedArray({ orderBy: 'title' }).map((todo) =>
          h('li', { key: todo.id }, [
            h('label', [
              h('input', {
                type: 'checkbox',
                checked: todo.done,
                onChange: () => todos.toggle(todo.id),
              }),
              todo.title,
            ]),
            h('button', { onClick: () => todos.deleteOne(todo.id) }, 'Delete'),
          ]),
        ),
      )
  },
})
