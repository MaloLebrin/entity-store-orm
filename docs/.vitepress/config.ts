import { defineConfig } from 'vitepress'

// GitHub Pages serves the project under /<repo>/; override with DOCS_BASE.
const base = process.env.DOCS_BASE ?? '/entity-store-orm/'

export default defineConfig({
  title: 'Entity Store',
  description:
    'Immutable normalized entity store with adapters for Pinia, Zustand, Redux Toolkit, Jotai and Valtio',
  lang: 'en-US',
  base,
  cleanUrls: true,
  // /api/ is the TypeDoc output copied from docs/public/api (not a VitePress page).
  ignoreDeadLinks: [/^\/api(\/|$)/, /^\.\/api/],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/quick-start' },
      { text: 'Adapters', link: '/guide/adapters/zustand' },
      { text: 'API reference', link: '/api/index.html', target: '_self' },
      {
        text: 'GitHub',
        link: 'https://github.com/MaloLebrin/entity-store-orm',
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Quick start', link: '/guide/quick-start' },
          { text: 'Concepts', link: '/guide/concepts' },
          { text: 'Filtering', link: '/guide/filters' },
          { text: 'Optimistic updates', link: '/guide/optimistic-updates' },
        ],
      },
      {
        text: 'Adapters',
        items: [
          { text: 'Pinia (Vue)', link: '/guide/adapters/pinia' },
          { text: 'Zustand', link: '/guide/adapters/zustand' },
          { text: 'Redux Toolkit', link: '/guide/adapters/redux' },
          { text: 'Jotai', link: '/guide/adapters/jotai' },
          { text: 'Valtio', link: '/guide/adapters/valtio' },
        ],
      },
    ],
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/MaloLebrin/entity-store-orm',
      },
    ],
  },
})
