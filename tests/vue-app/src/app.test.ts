import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { useTodos } from './stores.js'
import { TodoList } from './TodoList.js'

describe('Vue app using @entity-store/pinia (built package)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function render() {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(TodoList, { global: { plugins: [pinia] } })
  }

  test('re-renders when entities are created', async () => {
    const w = render()
    expect(w.findAll('li')).toHaveLength(0)
    await w.get('#add').trigger('click')
    await w.get('#add').trigger('click')
    expect(w.findAll('li')).toHaveLength(2)
    expect(w.get('#count').text()).toBe('2')
  })

  test('updates reflect dirty state and re-render', async () => {
    const w = render()
    await w.get('#add').trigger('click')
    await w.get('li').trigger('click')
    expect(w.get('li').text()).toContain('(done)')
    expect(w.get('li').classes()).toContain('dirty')
  })

  test('computed from extend reacts to filter changes', async () => {
    const w = render()
    await w.get('#add').trigger('click')
    await w.get('#add').trigger('click')
    await w.get('li').trigger('click')
    await w.get('#open').trigger('click')
    expect(w.findAll('li')).toHaveLength(1)
  })

  test('store state is shared between components using the same pinia', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useTodos().createOne({ id: 1, title: 'a', done: false })
    const w = mount(TodoList, { global: { plugins: [pinia] } })
    expect(w.findAll('li')).toHaveLength(1)
  })
})
