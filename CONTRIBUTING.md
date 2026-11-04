# Contributing

## Setup

```sh
pnpm install
pnpm build
pnpm test
```

## Before opening a PR

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm -r check:package
pnpm size
```

## Changesets

Every change to a published package needs a changeset:

```sh
pnpm changeset
```

Pick the affected packages and the bump level (patch, minor or major), and write a short summary.
Maintainers merge the generated "Version Packages" PR to publish.

## Design rules

- Core functions stay pure and immutable: `(state, ...args) => state`.
- Adapters stay thin and only bind the core functions to a state manager.
- Keep the bundle small: `pnpm size` must pass.
