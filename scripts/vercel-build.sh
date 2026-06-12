#!/usr/bin/env bash
set -euo pipefail

YARN_BIN="$(command -v yarn || true)"
if [ -z "$YARN_BIN" ] && [ -x /usr/local/bin/yarn ]; then
  YARN_BIN="/usr/local/bin/yarn"
fi

"$YARN_BIN" workspace ui build
"$YARN_BIN" workspace landing build
"$YARN_BIN" workspace candidate build
"$YARN_BIN" workspace map build

rm -rf dist
mkdir -p dist/static dist/ui dist/map dist/candidate

cp -R apps/landing/build/. dist/
cp -R apps/map/dist/. dist/map/
cp -R apps/candidate/out/. dist/candidate/
cp apps/map/dist/index.html dist/index.html

cp -R static/. dist/static/
cp packages/ui/dist/style.css dist/ui/style.css
cp packages/ui/dist/ui.umd.js dist/ui/ui.umd.js

if [ ! -f dist/map/index.html ]; then
  echo "Expected map build at dist/map/index.html" >&2
  exit 1
fi
