# Entity Store

A lightweight, ORM-agnostic entity management system with adapters for popular state managers.

## 🚀 Features

- **ORM Agnostic**: Works with any data structure that has an `id` field
- **TypeScript First**: Fully typed with excellent IntelliSense support
- **Multiple Adapters**: Support for Pinia, Redux, Zustand, Jotai, and Valtio (Pinia ready, others coming soon)
- **Comprehensive API**: Rich set of getters and actions for entity management
- **Dirty State Tracking**: Built-in support for tracking modified entities
- **Active Entity Management**: Support for current and active entity selection
- **Fully Tested**: Comprehensive test coverage for all core functionality

## 📦 Installation

```bash
pnpm add entity-store
```

## 🏗️ Architecture

The package is built with a modular architecture:

```
src/
├── core/           # Core entity management functions
│   ├── createState.ts    # State initialization
│   ├── createGetters.ts  # Query and retrieval functions
│   └── createActions.ts  # Mutation and update functions
├── types/          # TypeScript type definitions
├── adapters/       # State manager adapters
│   ├── pinia/      # Pinia adapter (ready)
│   ├── redux/      # Redux adapter (coming soon)
│   ├── zustand/    # Zustand adapter (coming soon)
│   ├── jotai/      # Jotai adapter (coming soon)
│   └── valtio/     # Valtio adapter (coming soon)
└── utils/          # Utility functions
```

## 🎯 Core Concepts

### Entity State Structure

```typescript
interface State<T extends WithId> {
  entities: {
    byId: Record<Id, T & { $isDirty: boolean }>
    allIds: Id[]
    current: (T & { $isDirty: boolean }) | null
    currentById: Id | null
    active: Id[]
  }
}
```

### Key Features

- **`byId`**: Dictionary of entities indexed by their ID
- **`allIds`**: Array of all entity IDs for iteration
- **`current`**: Currently selected entity
- **`currentById`**: ID of the currently selected entity
- **`active`**: Array of active entity IDs
- **`$isDirty`**: Flag indicating if an entity has been modified

## 🔧 Usage

### Core Functions

```typescript
import { createState, createGetters, createActions } from 'entity-store'

// Create state
const state = createState<User>()

// Create getters and actions
const getters = createGetters<User>(state)
const actions = createActions<User>(state)

// Use them
actions.createOne({ id: 1, name: 'John', email: 'john@example.com' })
const user = getters.getOne()(1)
```

### Pinia Adapter (Ready)

```typescript
import { createPiniaEntityStore } from 'entity-store/adapters/pinia'

interface User {
  id: number
  name: string
  email: string
}

// Create the store
const useUserStore = createPiniaEntityStore<User>('users')

// Use in your component
export default defineComponent({
  setup() {
    const userStore = useUserStore()
    
    // CRUD operations
    userStore.createOne({ id: 1, name: 'John', email: 'john@example.com' })
    userStore.updateOne(1, { name: 'John Updated' })
    userStore.deleteOne(1)
    
    // Querying
    const allUsers = userStore.getAllArray()
    const currentUser = userStore.getCurrent()
    const activeUsers = userStore.getActive()
    
    return { userStore, allUsers, currentUser, activeUsers }
  }
})
```

## 📚 API Reference

### Core Getters

- **`getAll()`**: Get all entities as dictionary
- **`getAllArray()`**: Get all entities as array
- **`getAllIds()`**: Get array of all entity IDs
- **`getOne(id)`**: Get single entity by ID
- **`getMany(ids)`**: Get multiple entities by IDs
- **`getCurrent()`**: Get currently selected entity
- **`getCurrentById()`**: Get entity by current ID
- **`getActive()`**: Get array of active entity IDs
- **`getWhere(filter)`**: Filter entities by predicate
- **`getMissingIds(ids)`**: Find IDs not in store
- **`getMissingEntities(entities)`**: Find entities not in store

### Core Actions

- **`createOne(entity)`**: Create single entity
- **`createMany(entities)`**: Create multiple entities
- **`updateOne(id, updates)`**: Update entity by ID
- **`updateMany(entities)`**: Update multiple entities
- **`deleteOne(id)`**: Delete entity by ID
- **`deleteMany(ids)`**: Delete multiple entities
- **`setCurrent(entity)`**: Set current entity
- **`setCurrentById(id)`**: Set current entity by ID
- **`setActive(id)`**: Set entity as active
- **`resetActive()`**: Clear all active entities
- **`setIsDirty(id)`**: Mark entity as modified
- **`setIsNotDirty(id)`**: Mark entity as unmodified

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm type-check
```

## 📖 Examples

See the `examples/` directory for complete usage examples:

- **`examples/pinia-usage.ts`**: Complete Pinia adapter demonstration
- **`src/adapters/pinia/example.ts`**: Pinia adapter usage patterns

## 🔮 Roadmap

### Phase 1: Core & Pinia ✅
- [x] Core entity management functions
- [x] Comprehensive test coverage
- [x] Pinia adapter
- [x] TypeScript support
- [x] Documentation

### Phase 2: Additional Adapters 🚧
- [ ] Redux adapter
- [ ] Zustand adapter
- [ ] Jotai adapter
- [ ] Valtio adapter

### Phase 3: Advanced Features 📋
- [ ] Pagination support
- [ ] Relationship management
- [ ] Caching strategies
- [ ] Performance optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern state management patterns
- Built with TypeScript and modern JavaScript features
- Comprehensive testing with Vitest
- Clean architecture principles
