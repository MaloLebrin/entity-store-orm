# Installation Guide

This guide explains how to install and use entity-store packages based on your needs.

## Package Options

### Option 1: Install everything (Recommended for beginners)

```bash
npm install entity-store
# or
pnpm add entity-store
# or
yarn add entity-store
```

**Use when:**
- You want to try all features
- You're building a new project
- You don't mind the larger bundle size

**Import:**
```typescript
import { createPiniaEntityStore } from 'entity-store'
import type { WithId } from 'entity-store'
```

### Option 2: Install only what you need (Recommended for production)

#### For Pinia users:
```bash
npm install @entity-store/pinia-adapter pinia
# or
pnpm add @entity-store/pinia-adapter pinia
# or
yarn add @entity-store/pinia-adapter pinia
```

**Import:**
```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'
import type { WithId } from '@entity-store/types'
```

#### For agnostic usage (any state manager):
```bash
npm install @entity-store/core @entity-store/types
# or
pnpm add @entity-store/core @entity-store/types
# or
yarn add @entity-store/core @entity-store/types
```

**Import:**
```typescript
import { createState, createActions, createGetters } from '@entity-store/core'
import type { WithId } from '@entity-store/types'
```

#### For types only:
```bash
npm install @entity-store/types
# or
pnpm add @entity-store/types
# or
yarn add @entity-store/types
```

**Import:**
```typescript
import type { WithId, State, FilterFn } from '@entity-store/types'
```

## Bundle Size Comparison

| Package | Size | Use Case |
|---------|------|----------|
| `@entity-store/types` | ~2KB | Types only |
| `@entity-store/core` | ~15KB | Core logic |
| `@entity-store/pinia-adapter` | ~20KB | Pinia integration |
| `entity-store` (all) | ~40KB | Everything |

## Migration from v1.0.0

If you're upgrading from the previous single-package version:

### Before (v1.0.0):
```typescript
import { createPiniaEntityStore } from 'entity-store'
```

### After (v2.0.0):
```typescript
// Option 1: Keep using the main package
import { createPiniaEntityStore } from 'entity-store'

// Option 2: Use the specific adapter (recommended)
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'
```

## Framework-Specific Setup

### Vue 3 + Pinia

```bash
npm install @entity-store/pinia-adapter pinia
```

```typescript
import { createPinia } from 'pinia'
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'

const pinia = createPinia()
app.use(pinia)

const useUserStore = createPiniaEntityStore<User>('users')
```

### React + Zustand (coming soon)

```bash
npm install @entity-store/zustand-adapter zustand
```

```typescript
import { createZustandEntityStore } from '@entity-store/zustand-adapter'

const useUserStore = createZustandEntityStore<User>('users')
```

### Vanilla JavaScript

```bash
npm install @entity-store/core @entity-store/types
```

```typescript
import { createState, createActions, createGetters } from '@entity-store/core'

const state = createState<User>()
const actions = createActions<User>(state)
const getters = createGetters<User>(state)
```

## TypeScript Configuration

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

## Troubleshooting

### Import errors

If you get import errors, check:

1. **Package name**: Make sure you're using the correct package name
2. **Dependencies**: Ensure peer dependencies are installed
3. **TypeScript version**: Use TypeScript 5.0+ for best experience

### Build errors

Common build issues:

1. **Module resolution**: Ensure your bundler supports ESM
2. **Tree-shaking**: Some bundlers may require specific configuration
3. **Type declarations**: Make sure `@types` packages are installed if needed

### Performance issues

For optimal performance:

1. **Use specific packages**: Install only what you need
2. **Enable tree-shaking**: Configure your bundler properly
3. **Lazy loading**: Import adapters only when needed

## Examples

See the `examples/` directory for complete usage examples:

- [Basic Pinia usage](./examples/pinia-basic-usage.ts)
- [Core usage](./examples/core-usage.ts) (coming soon)
- [Zustand usage](./examples/zustand-usage.ts) (coming soon)
