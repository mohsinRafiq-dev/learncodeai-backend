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

step "Logic tests"
# jest is a devDependency, so it is absent after --omit=dev. On a small
# instance installing the full dev tree is not worth the memory (
# mongodb-memory-server alone pulls down a mongod binary), so tests run in CI
# and locally instead. Set RUN_TESTS=1 to force them here.
if [ "${RUN_TESTS:-0}" = "1" ]; then
  npm install --no-save jest cross-env
  if ! npm run test:pure; then
    warn "tests failed — NOT restarting the service"
    warn "roll back with: git checkout $PREV"
    die "aborted before restart; production is still running the old code"
  fi
elif [ -x node_modules/.bin/jest ]; then
  npm run test:pure || die "tests failed — production untouched"
else
  warn "skipped (jest not installed after --omit=dev); run 'npm run test:pure' locally"
fi

step "Import smoke test"
# Cheap substitute for the full suite: proves every new module loads under the
# production dependency set, which is what --omit=dev could plausibly break.
#
# app.js is deliberately NOT imported here: importing it opens a Mongo
# connection and starts the executor containers, and with no explicit exit the
# process then hangs forever mid-deploy. The explicit process.exit below guards
# against the same thing from any module with a live handle.
timeout 60 node --input-type=module -e "
for (const m of [
  './src/services/ai/aiProvider.js',
  './src/services/ai/retrievalService.js',
  './src/services/ai/verifiedGeneration.js',
  './src/services/ai/verifiedTutorialService.js',
  './src/services/billing/entitlementService.js',
  './src/services/billing/aiCreditService.js',
  './src/services/billing/marketplaceService.js',
  './src/services/billing/connectService.js',
  './src/services/billing/courseLifecycleService.js',
  './src/controllers/tutorialController.js',
  './src/controllers/billingController.js',
  './src/controllers/creatorCourseController.js',
]) { await import(m); }
console.log('   all modules import cleanly');
process.exit(0);
" || die "module import failed — production untouched"

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
