# Recipes

## Load a list from an API, then merge pushes

```ts
users.actions.setAll(await fetchUsers()) // replace everything, all clean
socket.on('user', (u) => users.actions.upsertOne(u)) // merge, not dirty
```

## Fetch only once

```ts
if (!users.getters.isAlreadyInStore(id)) users.actions.addOne(await fetchUser(id))
```

## Save edited entities

```ts
for (const u of users.getters.getWhereArray((u) => u.$isDirty)) {
  await save(u)
  users.actions.setIsNotDirty(u.id)
}
```

## Relations (hasMany / belongsTo)

Relations are not built in. Keep one store per type and store foreign keys; join in a selector:

```ts
const postsOf = (userId: number) => posts.getters.getByField('authorId', userId)
```

## Pagination

Store the pages' ids outside the entities, next to your store, and read them with `getMany(ids)`:

```ts
const page = { ids: [] as number[], next: null as string | null }
users.actions.upsertMany(res.items)
page.ids.push(...res.items.map((u) => u.id))
const visible = users.getters.getMany(page.ids)
```
