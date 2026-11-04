export interface Todo {
  id: number
  title: string
  done: boolean
}
export const todo = (id: number): Todo => ({
  id,
  title: `todo ${id}`,
  done: false,
})
