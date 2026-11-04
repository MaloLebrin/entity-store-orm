import { defineComponent, h } from 'vue'
import { useTodos } from './stores.js'

export const TodoList = defineComponent({
  setup() {
    const todos = useTodos()
    return () =>
      h('div', [
        h(
          'button',
          {
            id: 'add',
            onClick: () =>
              todos.createOne({
                id: todos.getAllIds().length + 1,
                title: `todo ${todos.getAllIds().length + 1}`,
                done: false,
              }),
          },
          'add',
        ),
        h(
          'button',
          {
            id: 'open',
            onClick: () => {
              todos.filter = 'open'
            },
          },
          'open only',
        ),
        h(
          'ul',
          todos.visible.map((t) =>
            h(
              'li',
              {
                key: t.id,
                class: { dirty: t.$isDirty },
                onClick: () => todos.updateField('done', !t.done, t.id),
              },
              `${t.title}${t.done ? ' (done)' : ''}`,
            ),
          ),
        ),
        h('p', { id: 'count' }, String(todos.getAllIds().length)),
      ])
  },
})
