# Entity Store Plugin pour Pinia

Ce plugin Pinia ajoute automatiquement la gestion d'entités à tous vos stores Pinia existants, sans modifier leur structure actuelle.

## 🚀 Installation

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

const pinia = createPinia().use(entityStorePlugin)
app.use(pinia)
```

## ✨ Fonctionnalités

Le plugin ajoute automatiquement à tous vos stores :

### 🔧 **State étendu**
- `$entities.byId` : Record des entités par ID
- `$entities.allIds` : Liste des IDs
- `$entities.current` : Entité actuellement sélectionnée
- `$entities.currentById` : ID de l'entité actuelle
- `$entities.active` : Liste des IDs actifs

### 🎯 **Actions préfixées**
- `$createOne(entity)` : Créer une entité
- `$createMany(entities)` : Créer plusieurs entités
- `$updateOne(id, entity)` : Mettre à jour une entité
- `$updateMany(entities)` : Mettre à jour plusieurs entités
- `$deleteOne(id)` : Supprimer une entité
- `$deleteMany(ids)` : Supprimer plusieurs entités
- `$setCurrent(entity)` : Définir l'entité courante
- `$setCurrentById(id)` : Définir l'entité courante par ID
- `$removeCurrent()` : Supprimer l'entité courante
- `$removeCurrentById()` : Supprimer l'entité courante par ID
- `$setActive(id)` : Marquer une entité comme active
- `$resetActive()` : Réinitialiser les entités actives
- `$setIsDirty(id)` : Marquer une entité comme modifiée
- `$setIsNotDirty(id)` : Marquer une entité comme non modifiée
- `$updateField(field, value, id)` : Mettre à jour un champ spécifique

### 🔍 **Getters préfixés**
- `$getOne(id)` : Obtenir une entité par ID
- `$getMany(ids)` : Obtenir plusieurs entités par IDs
- `$getAll()` : Obtenir toutes les entités
- `$getAllArray()` : Obtenir toutes les entités sous forme de tableau
- `$getAllIds()` : Obtenir tous les IDs
- `$getCurrent()` : Obtenir l'entité courante
- `$getCurrentById()` : Obtenir l'entité courante par ID
- `$getActive()` : Obtenir les entités actives
- `$getFirstActive()` : Obtenir la première entité active
- `$getWhere(filter)` : Filtrer les entités
- `$getWhereArray(filter)` : Filtrer les entités sous forme de tableau
- `$getFirstWhere(filter)` : Obtenir la première entité filtrée
- `$getIsEmpty()` : Vérifier si le store est vide
- `$getIsNotEmpty()` : Vérifier si le store n'est pas vide
- `$isAlreadyInStore(id)` : Vérifier si une entité existe
- `$isAlreadyActive(id)` : Vérifier si une entité est active
- `$isDirty(id)` : Vérifier si une entité a été modifiée
- `$search(field)` : Rechercher dans les entités
- `$getMissingIds(ids)` : Obtenir les IDs manquants
- `$getMissingEntities(entities)` : Obtenir les entités manquantes

## 📖 Exemples d'utilisation

### Store simple avec plugin

```typescript
import { defineStore } from 'pinia'
import type { WithId } from '@entity-store/types'

interface User extends WithId {
  name: string
  email: string
  age: number
}

// Créer un store normal - le plugin ajoute automatiquement les fonctionnalités d'entités
export const useUserStore = defineStore('users', {
  state: () => ({
    // Votre state personnalisé
    isLoading: false,
    error: null,
    // Le plugin ajoute automatiquement $entities
  }),
  
  actions: {
    // Vos actions personnalisées
    async fetchUsers() {
      this.isLoading = true
      try {
        const users: User[] = await api.getUsers()
        // Utilisation des méthodes du plugin
        this.$createMany(users)
      } catch (error) {
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    // Vous pouvez toujours utiliser vos actions personnalisées
    customAction() {
      // Accès aux entités via le plugin
      const allUsers = this.$getAllArray()
      console.log('Total users:', allUsers.length)
    }
  },
  
  getters: {
    // Vos getters personnalisés
    getUsersByAge: (state) => (minAge: number) => {
      // Utilisation des getters du plugin
      return state.$getWhereArray((user) => user.age >= minAge)
    },
    
    getActiveUsersCount: (state) => () => {
      // Utilisation des getters du plugin
      return state.$getActive().length
    }
  }
})
```

### Utilisation dans un composant

```typescript
import { useUserStore } from '@/stores/users'

export default {
  setup() {
    const userStore = useUserStore()
    
    // Utilisation des méthodes du plugin
    const createUser = (user: User) => {
      userStore.$createOne(user)
    }
    
    const getUser = (id: string | number) => {
      return userStore.$getOne(id)
    }
    
    const getAllUsers = () => {
      return userStore.$getAllArray()
    }
    
    const updateUser = (id: string | number, updates: Partial<User>) => {
      const existingUser = userStore.$getOne(id)
      if (existingUser) {
        userStore.$updateOne(id, { ...existingUser, ...updates })
      }
    }
    
    const deleteUser = (id: string | number) => {
      userStore.$deleteOne(id)
    }
    
    const setCurrentUser = (user: User) => {
      userStore.$setCurrent(user)
    }
    
    const getCurrentUser = () => {
      return userStore.$getCurrent()
    }
    
    return {
      // État
      users: userStore.$entities,
      isLoading: userStore.isLoading,
      error: userStore.error,
      
      // Méthodes du plugin
      createUser,
      getUser,
      getAllUsers,
      updateUser,
      deleteUser,
      setCurrentUser,
      getCurrentUser,
      
      // Méthodes personnalisées
      fetchUsers: userStore.fetchUsers,
      getUsersByAge: userStore.getUsersByAge,
    }
  }
}
```

## 🔄 Coexistence avec l'Adaptateur

Ce plugin coexiste parfaitement avec l'adaptateur existant :

- **Plugin** : Ajoute des fonctionnalités à TOUS les stores (préfixées avec `$`)
- **Adaptateur** : Crée des stores spécialisés avec toutes les fonctionnalités intégrées

Vous pouvez utiliser les deux approches dans le même projet sans conflit.

## 🎯 Avantages du Plugin

1. **Non-intrusif** : N'affecte pas vos stores existants
2. **Automatique** : S'applique à tous les stores créés après l'installation
3. **Préfixé** : Toutes les propriétés ajoutées ont le préfixe `$` pour éviter les conflits
4. **Type-safe** : Support complet de TypeScript
5. **Performant** : Utilise le core existant pour la logique métier
6. **Devtools** : Intégration complète avec les outils de développement Pinia

## 🧪 Tests

```bash
# Lancer les tests du plugin
pnpm test plugin/plugin.test.ts
```

## 📚 Documentation

- [Core Documentation](../../../packages/core/README.md)
- [Types Documentation](../../../packages/types/README.md)
- [Pinia Adapter Documentation](../README.md)
