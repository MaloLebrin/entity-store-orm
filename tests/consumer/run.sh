#!/usr/bin/env bash
# Install the packed tarballs in a fresh project and check that a real consumer
# can resolve them: ESM import, CJS require, and types under several resolvers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/tests/consumer"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$ROOT"
pnpm build >/dev/null
mkdir "$WORK/packs" "$WORK/app"
for p in core pinia zustand redux jotai valtio; do
  (cd "packages/$p" && pnpm pack --pack-destination "$WORK/packs" >/dev/null)
done

cd "$WORK/app"
echo '{"name":"consumer","private":true,"type":"module"}' > package.json
npm install --no-audit --no-fund --silent "$WORK"/packs/*.tgz \
  pinia vue zustand @reduxjs/toolkit jotai valtio typescript@5.9 @types/node
cp "$HERE"/esm.mjs "$HERE"/cjs.cjs "$HERE"/app.ts .

echo "== ESM";  node esm.mjs
echo "== CJS";  node cjs.cjs
for mr in "node16 node16" "nodenext nodenext" "bundler esnext"; do
  set -- $mr
  echo "== types: moduleResolution=$1"
  npx tsc --noEmit --strict --moduleResolution "$1" --module "$2" \
    --target es2022 --types node app.ts
done
echo "consumer checks passed"
