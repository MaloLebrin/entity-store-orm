# Entity Store - Test Application

Cette application de test démontre l'utilisation de l'adaptateur Pinia de l'entity store.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- PNPM

### Installation

```bash
# Installer les dépendances
pnpm install

# Construire l'application
pnpm build

# Lancer en mode développement
pnpm dev
```

L'application sera accessible à l'adresse `http://localhost:3000`

## 🧪 Fonctionnalités testées

### 1. **Gestion des entités**
- ✅ Création d'entités avec ID unique
- ✅ Stockage dans la structure `byId` et `allIds`
- ✅ Suppression d'entités
- ✅ Mise à jour d'entités

### 2. **Gestion de l'état actuel**
- ✅ Définir une entité comme "current"
- ✅ Récupérer l'entité actuelle
- ✅ Supprimer l'entité actuelle
- ✅ Gestion de `currentById`

### 3. **Gestion des entités actives**
- ✅ Ajouter/supprimer des entités de la liste active
- ✅ Récupérer la liste des entités actives
- ✅ Réinitialiser la liste active

### 4. **Suivi des modifications**
- ✅ Marquage automatique des entités comme "dirty" lors des mises à jour
- ✅ Réinitialisation du statut "dirty"
- ✅ Affichage visuel des entités modifiées

### 5. **Interface utilisateur**
- ✅ Formulaire d'ajout d'entités
- ✅ Liste des entités avec actions
- ✅ Filtres et recherche
- ✅ Actions en lot
- ✅ Informations de débogage

## 🏗️ Architecture de test

### Composant SimpleDemo.vue

Ce composant simule la structure de l'entity store sans dépendre de l'adaptateur Pinia :

```typescript
// Structure de l'état
const state = reactive({
  entities: {
    byId: {} as Record<number, Entity & { $isDirty: boolean }>,
    allIds: [] as number[],
    current: null as (Entity & { $isDirty: boolean }) | null,
    currentById: null as number | null,
    active: [] as number[]
  }
})
```

### Fonctionnalités implémentées

- **CRUD complet** : Create, Read, Update, Delete
- **Gestion des états** : Current, Active, Dirty
- **Actions en lot** : Reset, Clear, Bulk operations
- **Interface réactive** : Vue 3 Composition API

## 🔧 Test de l'adaptateur Pinia

Pour tester l'adaptateur Pinia réel, vous pouvez :

1. **Modifier `main.ts`** pour utiliser l'adaptateur :
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue' // Utilise l'adaptateur Pinia
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')
```

2. **Vérifier que l'import fonctionne** :
```typescript
import { createPiniaEntityStore } from 'entity-store'
```

3. **Tester toutes les fonctionnalités** de l'adaptateur

## 📊 Métriques de test

L'application affiche en temps réel :
- Nombre total d'entités
- Présence d'une entité actuelle
- Nombre d'entités actives
- Statut des entités (current, active, dirty)

## 🎯 Scénarios de test

### Test 1 : Création d'entités
1. Remplir le formulaire avec nom et email
2. Cliquer sur "Add Entity"
3. Vérifier que l'entité apparaît dans la liste

### Test 2 : Gestion de l'état actuel
1. Cliquer sur "Set Current" pour une entité
2. Vérifier qu'elle apparaît dans la section "Current Entity"
3. Cliquer sur "Remove Current" pour la supprimer

### Test 3 : Gestion des entités actives
1. Cliquer sur "Set Active" pour plusieurs entités
2. Vérifier qu'elles apparaissent avec le badge "Active"
3. Utiliser "Reset Active" pour tout réinitialiser

### Test 4 : Suivi des modifications
1. Cliquer sur "Update" pour une entité
2. Vérifier qu'elle est marquée comme "Modified"
3. Utiliser "Reset All Modified" pour réinitialiser

### Test 5 : Actions en lot
1. Créer plusieurs entités
2. Tester "Clear All" pour tout supprimer
3. Vérifier que l'état est réinitialisé

## 🐛 Débogage

L'application inclut un panneau de débogage qui affiche :
- Tous les IDs d'entités
- L'entité actuelle
- L'ID de l'entité actuelle
- La liste des entités actives
- L'état complet du store

## 📝 Notes de développement

- L'application utilise Vue 3 Composition API
- TypeScript est configuré pour la sécurité des types
- Vite est utilisé pour le build et le développement
- Les styles sont organisés avec CSS modulaire

## 🚀 Prochaines étapes

1. **Tester l'adaptateur Pinia réel** en résolvant les problèmes d'import
2. **Ajouter des tests unitaires** avec Vitest
3. **Implémenter la persistance** avec localStorage
4. **Ajouter des validations** de formulaire
5. **Créer des composants réutilisables** pour l'UI
