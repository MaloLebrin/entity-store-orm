# Filtering

`getWhereArray`, `getWhere` and `getFirstWhere` accept either a **predicate** or a **declarative object**.

<<< @/../examples/docs/src/filters.ts

## Object filters

- Strict equality (SameValueZero, like `getByField`) on **every** listed field, combined with AND.
- Typed on the entity: `{ age: '30' }` does not compile when `age` is a number.
- `{}` matches everything. Values are compared with SameValueZero, so object-valued fields match by reference only.
- The first field goes through the `getByField` index, so `getFirstWhere(state, { email })` is O(1) once the index is built. Other fields filter that bucket.

## Memoization: by value vs by reference

| Filter | Cache key | Inline literal / arrow |
| --- | --- | --- |
| Object `{ role: 'admin' }` | its **content** (`{ a, b }` equals `{ b, a }`) | hits the cache |
| Predicate `(u) => u.age >= 18` | its **reference** | misses: hoist it to a constant |

Up to 8 distinct object filters are remembered per collection. As with the other [memoized getters](./concepts#memoization-and-shared-results), results are shared and read-only (frozen outside production), and `{ memoize: false }` returns fresh results.

Sorting works as before: `getWhereArray(state, { role: 'admin' }, { orderBy: 'age', sortBy: 'desc' })`. `getWhere` returns a dictionary, so sorting does not apply.
