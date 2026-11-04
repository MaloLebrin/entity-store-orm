# Concepts

## Normalized state

A collection is stored as one plain, serializable object, whatever the adapter:

```ts
{
  entities: {
    byId: Record<Id, T & { $isDirty: boolean; $meta: { changedFields; createdAt; updatedAt } }>,
    allIds: Id[],          // insertion order, drives every derived array
    current: T | null,     // an entity being edited / displayed, independent from byId
    currentById: Id | null,// id of a stored entity used as the current one
    active: Id[],          // e.g. selected rows
  }
}
```

- Entities are looked up by id in `byId`; their order lives in `allIds`.
- Each stored entity carries `$isDirty` and `$meta` (`changedFields`, `createdAt`, `updatedAt`). `updateOne`, `updateMany` and `updateField` mark an entity dirty and record the changed fields; `setIsNotDirty` resets them. `$meta` holds plain numbers/arrays (no `Date` or `Set`), so Redux, devtools and persistence work out of the box.
- `setAll` replaces the whole collection (every entity clean), which is what you want after loading from an API. `active`, `current` and `currentById` survive only if they still point to an entity of the new list.

## Pure, immutable functions

Every action in `@entity-store/core` is `(state, ...args) => nextState`:

- the input state is **never mutated**;
- unchanged parts are shared structurally (`byId` is only copied when an entity changes);
- when an action changes nothing, you get **the same state reference back**, so change detection (`===`) stays cheap and no spurious re-render happens.

Adapters only plug these functions into a container through `createEntityApi({ get, set })`. Because the state is replaced rather than mutated, Pinia keeps it in a `shallowRef`, Valtio stores it with `ref()`, and the Redux reducers return the next state as-is.

## Memoization and shared results

`getAllArray`, `getWhereArray`, `getSortedArray` and `getByField` are memoized by default:

| Getter           | Cached for                                                          | Notes                                                                                                            |
| ---------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `getAllArray`    | the current `byId` + `allIds`                                       | `current`, `active` and `currentById` changes don't invalidate it                                                |
| `getSortedArray` | `(byId, allIds, orderBy, sortBy)`                                   | up to 4 orderings per collection; use a field name or a stable function, an inline arrow is a new key every call |
| `getWhereArray`  | `(byId, allIds, filter, orderBy, sortBy)`, one entry per collection | pass a stable `filter` reference to benefit                                                                      |
| `getByField`     | a per-field index, built in O(n) on first use, O(1) afterwards      | misses return one shared empty array                                                                             |

The consequence is that **results are shared**: two calls return the very same array. That makes them safe as `useEffect`/`computed`/selector dependencies, but you must treat them as read-only.

```ts
const sorted = [...users.getAllArray()].sort(byAge) // copy first
users.getAllArray().sort(byAge) // ❌ throws outside production
```

Outside production (`process.env.NODE_ENV !== 'production'`) memoized arrays are **frozen**, so an in-place `sort()` or `push()` throws instead of silently corrupting the cache for every other reader. In production they are not frozen (no cost), so the mistake would go unnoticed: rely on tests and dev builds to catch it.

To opt out, create the adapter (or `createEntityApi`) with `{ memoize: false }`: derived arrays are then rebuilt on every call.

## Getters and reactivity

Getters are plain functions over the state; how a UI re-renders depends on the container:

- **Zustand**: call them inside the selector.
- **Redux**: use the selectors from `getSelectors`.
- **Jotai**: read a getter atom, then call the function it holds.
- **Pinia**: getters read a `shallowRef`, so calls inside a `computed` or render function are tracked.
- **Valtio**: use `snapshotGetters(snap)`; see the [pitfall](./adapters/valtio#the-pitfall-snap-getone-1-does-not-subscribe).
