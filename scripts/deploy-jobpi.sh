#!/usr/bin/env bash
# Deploy Mars Colony Manager on jobpi (static dist → 127.0.0.1:8018).
# Run on the Pi as jcube from any cwd:
#   bash ~/projects/mars-colony-manager/scripts/deploy-jobpi.sh
#   bash ~/projects/mars-colony-manager/scripts/deploy-jobpi.sh --swap-only
#   bash ~/projects/mars-colony-manager/scripts/deploy-jobpi.sh --rollback
#
# Live dist/ is never the Vite outDir. Build writes dist.next, then the
# directories are renamed into place and the unit restarts. A failed
# health check restores dist.prev.
#
# Expected layout: ~/projects/mars-colony-manager (this repo).
# Does not edit Cloudflare config (one-time; see DEPLOY.md).

set -euo pipefail

REPO="${MCM_REPO:-$HOME/projects/mars-colony-manager}"
BRANCH="${MCM_BRANCH:-main}"
PORT=8018
USER_UNIT_SRC="$REPO/deploy/mars-colony-manager.user.service"
USER_UNIT_DST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/mars-colony-manager.service"

LIVE="$REPO/dist"
STAGING="$REPO/dist.next"
PREV="$REPO/dist.prev"
FAILED="$REPO/dist.failed"

MODE="full"
if [[ "${1:-}" == "--swap-only" ]]; then
  MODE="swap-only"
elif [[ "${1:-}" == "--rollback" ]]; then
  MODE="rollback"
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--swap-only|--rollback]" >&2
  exit 2
fi

cd "$REPO"

install_unit() {
  echo "==> install user systemd unit"
  mkdir -p "$(dirname "$USER_UNIT_DST")"
  cp "$USER_UNIT_SRC" "$USER_UNIT_DST"
  systemctl --user daemon-reload
  systemctl --user enable mars-colony-manager.service
}

restart_unit() {
  systemctl --user restart mars-colony-manager.service
  systemctl --user --no-pager --full status mars-colony-manager.service || true
}

# Rename live → prev, staging → live. Same-filesystem mv; live dist/ is
# untouched until this runs. Tiny gap between the two renames.
swap_staging_into_live() {
  if [[ ! -f "$STAGING/index.html" ]]; then
    echo "ERROR: $STAGING/index.html missing — refuse to swap" >&2
    exit 1
  fi
  echo "==> swap dist.next → dist/ (previous kept as dist.prev)"
  rm -rf "$PREV"
  if [[ -e "$LIVE" ]]; then
    mv "$LIVE" "$PREV"
  fi
  mv "$STAGING" "$LIVE"
}

restore_prev() {
  if [[ ! -f "$PREV/index.html" ]]; then
    echo "ERROR: $PREV/index.html missing — cannot roll back" >&2
    exit 1
  fi
  echo "==> restore dist.prev → dist/"
  rm -rf "$FAILED"
  if [[ -e "$LIVE" ]]; then
    mv "$LIVE" "$FAILED"
  fi
  mv "$PREV" "$LIVE"
}

health_check() {
  echo "==> health check http://127.0.0.1:${PORT}/"
  sleep 1
  curl -fsS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"
}

health_check_or_rollback() {
  echo "==> health check http://127.0.0.1:${PORT}/"
  sleep 1
  if curl -fsS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"; then
    return 0
  fi
  echo "ERROR: health check failed after cutover" >&2
  if [[ -f "$PREV/index.html" ]]; then
    restore_prev
    restart_unit
    health_check
  else
    echo "ERROR: no dist.prev to restore" >&2
  fi
  exit 1
}

if [[ "$MODE" == "rollback" ]]; then
  restore_prev
  restart_unit
  health_check
  echo "Rolled back. Public URL: https://mars.job-joseph.com/"
  exit 0
fi

if [[ "$MODE" == "full" ]]; then
  echo "==> git fetch / checkout $BRANCH"
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"

  echo "==> npm ci"
  npm ci

  echo "==> npm test (sim contract)"
  npm test

  echo "==> typecheck + Vite build into dist.next (live dist/ untouched)"
  rm -rf "$STAGING"
  npx tsc --noEmit
  npx vite build --outDir dist.next --emptyOutDir
fi

if [[ ! -f "$STAGING/index.html" ]]; then
  echo "ERROR: dist.next/index.html missing" >&2
  exit 1
fi

install_unit
swap_staging_into_live
restart_unit
health_check_or_rollback

echo "Done. Public URL (after tunnel): https://mars.job-joseph.com/"
echo "Previous build kept at dist.prev (rollback: $0 --rollback)"
