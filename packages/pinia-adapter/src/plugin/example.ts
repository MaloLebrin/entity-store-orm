import { createPinia, defineStore } from 'pinia'
import { createApp } from 'vue'
import { entityStorePlugin } from './plugin'

// 1. Créer une application Vue
const app = createApp({})

// 2. Créer une instance Pinia
const pinia = createPinia()

// 3. Installer le plugin
pinia.use(entityStorePlugin)

// 4. Installer Pinia dans l'application
app.use(pinia)

// 5. Définir un store normal (le plugin ajoutera automatiquement la gestion d'entités)
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

// 6. Utiliser le store avec la gestion d'entités automatique
const userStore = useUserStore()

// 7. Utiliser les fonctionnalités d'entités préfixées avec $
const user1 = { id: 1, name: 'John Doe', email: 'john@example.com' }
const user2 = { id: 2, name: 'Jane Smith', email: 'jane@example.com' }

// Créer des entités
userStore.$createOne(user1)
userStore.$createMany([user2])

// Récupérer des entités
console.log('All users:', userStore.$getAll())
console.log('All user IDs:', userStore.$getAllIds())
console.log('User by ID:', userStore.$getOne(1))

// Rechercher des entités
const johnUsers = userStore.$search('John')
console.log('Users with "John":', johnUsers)

// Mettre à jour une entité
userStore.$updateOne(1, { name: 'John Updated' })

// Supprimer une entité
userStore.$deleteOne(2)

// Vérifier l'état final
console.log('Final users:', userStore.$getAll())
console.log('Final user IDs:', userStore.$getAllIds())

// 8. Le store conserve ses fonctionnalités personnalisées
console.log('Custom field:', userStore.customField)
console.log('Custom action:', userStore.customAction())

// 9. L'état des entités est accessible via $entities
console.log('Entities state:', userStore.$entities)
console.log('Entities by ID:', userStore.$entities.byId)
console.log('All IDs:', userStore.$entities.allIds)
console.log('Current entity:', userStore.$entities.current)
console.log('Active entities:', userStore.$entities.active)
