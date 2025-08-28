# @entity-store/types

Shared types package for entity-store, defining all common interfaces and types.

## Installation

```bash
npm install @entity-store/types
# or
pnpm add @entity-store/types
# or
yarn add @entity-store/types
```

## Available Types

### WithId

Base interface for all entities with a unique identifier.

```typescript
import type { WithId, Id } from '@entity-store/types'

interface User extends WithId {
  name: string
  email: string
  age: number
}

// WithId automatically adds:
// - id: Id (string | number)
// - $isDirty: boolean (for modification tracking)
```

### State

Interface defining the entity state structure.

```typescript
import type { State } from '@entity-store/types'

interface State<T> {
  entities: {
    byId: Record<string, T>           // Entities indexed by ID
    allIds: string[]                  // List of all IDs
    current: T | null                 // Currently selected entity
    currentById: string | null        // ID of current entity
    active: string[]                  // List of active IDs
  }
}
```

### Filter

Types for entity filtering functions.

```typescript
import type { FilterFn, OptionalFilterFn } from '@entity-store/types'

// Required filtering function
type FilterFn<T> = (entity: T) => boolean

// Optional filtering function
type OptionalFilterFn<T> = (entity: T) => boolean | null

// Usage example
const filterAdults: FilterFn<User> = (user) => user.age >= 18
const filterByName: OptionalFilterFn<User> = (user) => 
  user.name.includes('John') ? true : null
```

### ByIdParams

Interface for ID-based search parameters.

```typescript
import type { ByIdParams } from '@entity-store/types'

interface ByIdParams {
  id: string | number
}
```

## Usage

### Create an entity interface

```typescript
import type { WithId } from '@entity-store/types'

interface Product extends WithId {
  name: string
  price: number
  category: string
  inStock: boolean
}

// Product interface will automatically have:
// - id: string | number
// - $isDirty: boolean
```

### Usage with core

```typescript
import type { State, WithId } from '@entity-store/types'
import { createState } from '@entity-store/core'

interface User extends WithId {
  name: string
  email: string
}

// Create typed state
const state: State<User> = createState<User>()
```

### Usage with adapters

```typescript
import type { WithId } from '@entity-store/types'
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'

interface Post extends WithId {
  title: string
  content: string
  authorId: string
  publishedAt: Date
}

// Create typed Pinia store
const usePostStore = createPiniaEntityStore<Post>('posts')
```

## Benefits

- **Centralized**: All types in one place
- **Reusable**: Used by all packages
- **Type-safe**: Fully typed with TypeScript
- **Consistent**: Same structure everywhere
- **Maintainable**: Centralized modifications
