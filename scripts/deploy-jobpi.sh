#!/usr/bin/env bash
# Deploy Mars Colony Manager on jobpi (static dist → 127.0.0.1:8018).
# Run on the Pi as jcube from any cwd:
#   bash ~/projects/mars-colony-manager/scripts/deploy-jobpi.sh
#
# Expected layout: ~/projects/mars-colony-manager (this repo).
# Does not edit Cloudflare config (one-time; see DEPLOY.md).

set -euo pipefail

REPO="${MCM_REPO:-$HOME/projects/mars-colony-manager}"
BRANCH="${MCM_BRANCH:-main}"
PORT=8018
USER_UNIT_SRC="$REPO/deploy/mars-colony-manager.user.service"
USER_UNIT_DST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/mars-colony-manager.service"

cd "$REPO"

echo "==> git fetch / checkout $BRANCH"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> npm ci && npm run build"
npm ci
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html missing after build" >&2
  exit 1
fi

echo "==> install user systemd unit"
mkdir -p "$(dirname "$USER_UNIT_DST")"
cp "$USER_UNIT_SRC" "$USER_UNIT_DST"
systemctl --user daemon-reload
systemctl --user enable mars-colony-manager.service
systemctl --user restart mars-colony-manager.service
systemctl --user --no-pager --full status mars-colony-manager.service || true

echo "==> health check http://127.0.0.1:${PORT}/"
sleep 1
curl -fsS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"

echo "Done. Public URL (after tunnel): https://mars.job-joseph.com/"
