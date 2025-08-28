# @entity-store/pinia-adapter

Ce package fournit deux approches différentes pour utiliser la gestion d'entités avec Pinia :

## 🚀 Deux Approches

### 1. **Plugin Approach** (Recommandé pour les stores existants)

Le plugin Pinia ajoute automatiquement la gestion d'entités à **tous** vos stores existants sans modification de code.

#### Installation

```bash
npm install @entity-store/pinia-adapter
# ou
pnpm add @entity-store/pinia-adapter
# ou
yarn add @entity-store/pinia-adapter
```

#### Utilisation

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

// Créer une instance Pinia
const pinia = createPinia()

// Installer le plugin
pinia.use(entityStorePlugin)

// Utiliser Pinia dans votre app Vue
app.use(pinia)
```

#### Fonctionnalités ajoutées automatiquement

Toutes les propriétés sont préfixées avec `$` pour éviter les conflits :

**État :**
- `$entities` - État complet des entités (byId, allIds, current, active, etc.)

**Actions :**
- `$createOne(entity)` - Créer une entité
- `$createMany(entities)` - Créer plusieurs entités
- `$updateOne(id, updates)` - Mettre à jour une entité
- `$updateMany(updates)` - Mettre à jour plusieurs entités
- `$deleteOne(id)` - Supprimer une entité
- `$deleteMany(ids)` - Supprimer plusieurs entités
- `$setCurrent(entity)` - Définir l'entité courante
- `$setActive(id)` - Marquer une entité comme active
- `$resetActive()` - Réinitialiser les entités actives
- `$setIsDirty(id)` - Marquer une entité comme modifiée
- `$updateField(field, value, id)` - Mettre à jour un champ spécifique

**Getters :**
- `$getOne(id)` - Récupérer une entité par ID
- `$getMany(ids)` - Récupérer plusieurs entités par IDs
- `$getAll()` - Récupérer toutes les entités
- `$getAllArray()` - Récupérer toutes les entités en tableau
- `$getAllIds()` - Récupérer tous les IDs
- `$getCurrent()` - Récupérer l'entité courante
- `$getActive()` - Récupérer les entités actives
- `$getWhere(filter)` - Filtrer les entités
- `$search(query)` - Rechercher dans les entités
- `$isAlreadyInStore(id)` - Vérifier si une entité existe
- `$isDirty(id)` - Vérifier si une entité est modifiée

#### Exemple complet

```typescript
import { defineStore } from 'pinia'

// Définir un store normal
const useUserStore = defineStore('users', {
  state: () => ({
    customField: 'users'
  }),
  actions: {
    customAction() {
      return 'custom user action'
    }
  }
})

// Utiliser le store
const userStore = useUserStore()

// La gestion d'entités est automatiquement disponible !
const user = { id: 1, name: 'John Doe', email: 'john@example.com' }

userStore.$createOne(user)
console.log(userStore.$getOne(1)) // { id: 1, name: 'John Doe', email: 'john@example.com', $isDirty: false }
console.log(userStore.$getAllIds()) // ['1']

// Le store conserve ses fonctionnalités personnalisées
console.log(userStore.customField) // 'users'
console.log(userStore.customAction()) // 'custom user action'
```

### 2. **Adapter Approach** (Pour les nouveaux stores)

L'approche adaptateur crée des stores spécialisés avec la gestion d'entités intégrée.

#### Utilisation

```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'

interface User {
  id: number
  name: string
  email: string
}

const useUserStore = createPiniaEntityStore<User>('users', {
  state: () => ({
    customField: 'users'
  }),
  actions: {
    customAction() {
      return 'custom user action'
    }
  }
})
```

## 🔧 Configuration

### Options du plugin

```typescript
import { entityStorePlugin } from '@entity-store/pinia-adapter'

// Le plugin accepte des options (actuellement aucune option requise)
pinia.use(entityStorePlugin())
```

### Fonction helper

```typescript
import { installEntityStorePlugin } from '@entity-store/pinia-adapter'

// Alternative à pinia.use(entityStorePlugin())
installEntityStorePlugin(pinia)
```

## 🎯 Cas d'usage

### Plugin Approach - Idéal pour :
- **Stores existants** que vous ne voulez pas modifier
- **Migration progressive** vers la gestion d'entités
- **Applications avec beaucoup de stores** différents
- **Réutilisabilité** maximale

### Adapter Approach - Idéal pour :
- **Nouveaux stores** conçus spécifiquement pour les entités
- **Type safety** maximale avec TypeScript
- **Contrôle total** sur la structure du store
- **Performance** optimisée pour les entités

## 🚀 Avantages du Plugin

1. **Zéro modification de code** - Ajoute la gestion d'entités à tous vos stores existants
2. **Préfixage automatique** - Toutes les propriétés sont préfixées avec `$` pour éviter les conflits
3. **Intégration transparente** - Fonctionne avec tous vos stores Pinia existants
4. **SSR compatible** - Gestion correcte de l'état pour le rendu côté serveur
5. **DevTools intégrés** - Toutes les propriétés sont visibles dans les Pinia DevTools
6. **Performance optimisée** - Utilise le core `@entity-store/core` pour une gestion efficace

## 📚 API Référence

### Plugin

```typescript
// Installation
pinia.use(entityStorePlugin)

// Fonction helper
installEntityStorePlugin(pinia)
```

### Types

```typescript
import type { EntityStorePlugin, EntityPluginContext, EntityPluginOptions } from '@entity-store/pinia-adapter'
```

## 🔍 Dépannage

### Les propriétés ne sont pas ajoutées

Assurez-vous que le plugin est installé **avant** de définir vos stores :

```typescript
// ✅ Correct
const pinia = createPinia()
pinia.use(entityStorePlugin)
const store = defineStore('test', { ... })

// ❌ Incorrect
const store = defineStore('test', { ... })
pinia.use(entityStorePlugin)
```

### Conflits de noms

Toutes les propriétés sont préfixées avec `$`. Si vous avez des propriétés commençant par `$` dans vos stores, elles ne seront pas écrasées.

## 🎉 Conclusion

Le plugin Pinia offre une solution élégante et non-intrusive pour ajouter la gestion d'entités à tous vos stores existants. Il vous permet de bénéficier de toutes les fonctionnalités de `@entity-store/core` sans modifier votre code existant.

**Recommandation :** Commencez avec le plugin pour vos stores existants, et utilisez l'adaptateur pour les nouveaux stores qui nécessitent une gestion d'entités spécialisée.
