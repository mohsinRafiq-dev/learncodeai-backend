#!/usr/bin/env bash
# Deploys the current branch on the EC2 host.
#
# Fails fast and leaves the running service untouched if anything before the
# restart goes wrong. Records the previous commit so a rollback is one command.
#
# Usage (on the EC2 instance, from the repo root):
#   bash scripts/unix/deploy-production.sh [branch]

set -euo pipefail

BRANCH="${1:-feat/verified-generation}"
APP_NAME="${PM2_APP_NAME:-learncodeai-backend}"

GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; NC=$'\033[0m'
step() { printf '\n%s>> %s%s\n' "$GREEN" "$1" "$NC"; }
warn() { printf '%s   %s%s\n' "$YELLOW" "$1" "$NC"; }
die()  { printf '%s!! %s%s\n' "$RED" "$1" "$NC" >&2; exit 1; }

[ -f package.json ] || die "run this from the backend repo root"

step "Recording current state for rollback"
PREV=$(git rev-parse HEAD)
echo "   current commit: $PREV"
echo "$PREV" > .last-deploy-commit

if ! git diff --quiet || ! git diff --cached --quiet; then
  die "working tree is dirty — commit or stash on the server before deploying"
fi

step "Fetching $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "   now at: $(git rev-parse --short HEAD) $(git log -1 --format=%s)"

step "Installing dependencies"
npm ci --omit=dev

step "Running logic tests (no DB or Docker required)"
# These must pass before anything restarts. They cover the verification loop
# and the metric arithmetic.
if ! npm run test:pure; then
  warn "tests failed — NOT restarting the service"
  warn "roll back with: git checkout $PREV"
  die "aborted before restart; production is still running the old code"
fi

step "Restarting $APP_NAME"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
  sleep 4
  pm2 list | grep -E "$APP_NAME|Name" || true
else
  warn "pm2 not found — restart the service manually"
fi

step "Verifying"
PORT_="${PORT:-4000}"
if curl -fsS --max-time 10 "http://localhost:${PORT_}/healthz" >/dev/null; then
  echo "   healthz OK"
else
  warn "healthz did not respond — check: pm2 logs $APP_NAME --lines 100"
  warn "roll back with: git checkout $PREV && npm ci --omit=dev && pm2 restart $APP_NAME"
  die "deploy verification failed"
fi

step "Sandbox check"
bash scripts/unix/diagnose-production.sh 2>/dev/null | sed -n '/Code execution/,/Summary/p' || true

cat <<EOF

Deployed $(git rev-parse --short HEAD) on branch $BRANCH.

Rollback:
  git checkout $PREV && npm ci --omit=dev && pm2 restart $APP_NAME

If the sandbox check above failed, AI tutorials will still publish but their
code examples ship unverified (verification.sandboxDegraded = true).
See docs/DEPLOYMENT_EC2.md Step 3.
EOF
