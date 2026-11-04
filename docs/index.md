---
layout: home
hero:
  name: Entity Store
  text: Normalized entities, any state manager
  tagline: Pure, immutable actions and getters on a plain serializable state. Adapters for Pinia, Zustand, Redux Toolkit, Jotai and Valtio.
  actions:
    - theme: brand
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: Concepts
      link: /guide/concepts
    - theme: alt
      text: API reference
      link: /api/index.html
      target: _self
features:
  - title: Pure functions
    details: Every action is (state, ...args) => nextState. No mutation, no Proxy, structural sharing.
  - title: Same API everywhere
    details: Identical action and getter names in every adapter; only the way you call them changes.
  - title: Memoized derived arrays
    details: getAllArray, getSortedArray, getWhereArray and getByField return stable references, safe as React/Vue dependencies.
---
