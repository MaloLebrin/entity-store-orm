# Entity Store

ORM-agnostic entity management system with adapters for different state managers, organized as a monorepo for better modularity and performance.

## 🏗️ Architecture

The project is organized in separate packages to enable targeted usage and optimal tree-shaking:

```
entity-store/
├── packages/
│   ├── core/           # Pure business logic, 0 dependencies
│   ├── types/          # Shared types
│   ├── pinia-adapter/  # Pinia adapter
│   └── main/           # Main package with conditional exports
```

## 📦 Available Packages

### @entity-store/core
Agnostic package containing entity management business logic.

```bash
npm install @entity-store/core
```

**Features:**
- `createState()` : Initial state creation
- `createActions()` : CRUD actions for entities
- `createGetters()` : Getters for retrieving and filtering data

### @entity-store/pinia-adapter
Pinia adapter with all core functionality.

```bash
npm install @entity-store/pinia-adapter pinia
```

**Features:**
- Complete Pinia store with entity management
- Customizable extensions (state, getters, actions)
- Native integration with Vue ecosystem

### entity-store (main package)
Main package that exports everything, for simple usage.

```bash
npm install entity-store
```

## 🚀 Quick Start

### With Pinia (recommended)

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

const pinia = createPinia().use(entityStorePlugin)
app.use(pinia)

// In a Vue component
const userStore = useUserStore()
userStore.createOne({ id: 1, name: 'John', email: 'john@example.com' })
```

### With Core (agnostic)

```typescript
import { createState, createActions, createGetters } from '@entity-store/core'
import type { WithId } from '@entity-store/types'

interface User extends WithId {
  name: string
  email: string
}

const state = createState<User>()
const actions = createActions<User>(state)
const getters = createGetters<User>(state)

// Usage
actions.createOne({ id: 1, name: 'John', email: 'john@example.com' })
const user = getters.getOne()(1)
```

## 🎯 Benefits of this Architecture

### **Optimal Tree-shaking**
- Import only what you need
- Minimal bundle size for production

### **Isolated Dependencies**
- Each package manages its own dependencies
- No conflicts between state managers

### **Scalability**
- Easy addition of new adapters
- Simplified maintenance per package

### **Usage Flexibility**
- Use core alone for an agnostic solution
- Or a specific adapter for native integration

## 🔧 Development

### Install dependencies

```bash
pnpm install
```

### Build all packages

```bash
pnpm build
```

### Tests

```bash
pnpm test
```

### Development in watch mode

```bash
pnpm dev
```

## 📚 Documentation

- [Core Documentation](./packages/core/README.md)
- [Types Documentation](./packages/types/README.md)
- [Pinia Adapter Documentation](./packages/pinia-adapter/README.md)

## 🚧 Roadmap

- [ ] Zustand Adapter
- [ ] Redux Toolkit Adapter
- [ ] Jotai Adapter
- [ ] Valtio Adapter
- [x] Pinia Plugin
- [ ] Migration tools
- [ ] Integration examples

## 🤝 Contributing

Contributions are welcome! Each package can be developed and tested independently.

## 📄 License

MIT
