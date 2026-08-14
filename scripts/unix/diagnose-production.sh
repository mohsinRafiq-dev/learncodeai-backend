#!/usr/bin/env bash
# Read-only production diagnostic. Changes nothing.
#
# Answers the question that decides whether verified generation can work:
# is there a functioning code-execution sandbox on this host?
#
# Usage (on the EC2 instance):
#   bash scripts/unix/diagnose-production.sh

set -uo pipefail

BLUE=$'\033[0;34m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; NC=$'\033[0m'
section() { printf '\n%s== %s ==%s\n' "$BLUE" "$1" "$NC"; }
ok()      { printf '%s  OK%s   %s\n' "$GREEN" "$NC" "$1"; }
warn()    { printf '%s  WARN%s %s\n' "$YELLOW" "$NC" "$1"; }
bad()     { printf '%s  FAIL%s %s\n' "$RED" "$NC" "$1"; }

API_PORT="${PORT:-4000}"
API="http://localhost:${API_PORT}"

section "Host"
echo "  uptime:  $(uptime -p 2>/dev/null || uptime)"
echo "  memory:  $(free -h 2>/dev/null | awk '/^Mem:/{print $3 " used / " $2}')"
echo "  disk:    $(df -h / | awk 'NR==2{print $3 " used / " $2 " (" $5 " full)"}')"
echo "  node:    $(node --version 2>/dev/null || echo 'not installed')"

section "Docker"
if command -v docker >/dev/null 2>&1; then
  ok "docker installed: $(docker --version)"
  if docker info >/dev/null 2>&1; then
    ok "docker daemon reachable by $(whoami)"
  else
    bad "docker daemon NOT reachable by $(whoami) (try: sudo usermod -aG docker $(whoami), then re-login)"
  fi
  echo
  echo "  running containers:"
  docker ps --format '    {{.Names}}  {{.Status}}  {{.Ports}}' 2>/dev/null || echo "    (cannot list)"
else
  bad "docker is NOT installed — the sandbox cannot run"
fi

section "Executor containers"
# containerManager.js creates these names; docker-compose.secure.yml creates
# the short ones. Which set exists tells us which strategy is actually live.
for n in learncodeai-python-executor learncodeai-javascript-executor learncodeai-cpp-executor; do
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$n"; then
    ok "$n running (runtime-managed strategy)"
  else
    warn "$n not running"
  fi
done
for n in python-executor javascript-executor cpp-executor; do
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$n"; then
    ok "$n running (compose-managed strategy)"
  fi
done

section "Backend process"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list 2>/dev/null | sed 's/^/  /'
else
  warn "pm2 not found"
  systemctl list-units --type=service 2>/dev/null | grep -i learncode | sed 's/^/  /' || true
fi

section "Environment (values masked)"
if [ -f .env ]; then
  grep -E '^(CODE_EXEC_BACKEND|PISTON_URL|AI_PROVIDER_ORDER|AI_MAX_REPAIR_ATTEMPTS|NODE_ENV|PORT)=' .env | sed 's/^/  /'
  for k in GEMINI_API_KEY OPENAI_API_KEY MONGODB_URI JWT_SECRET SESSION_SECRET; do
    if grep -q "^${k}=." .env 2>/dev/null; then ok "$k is set"; else warn "$k is MISSING"; fi
  done
else
  bad "no .env file in $(pwd)"
fi

section "API health"
if curl -fsS --max-time 5 "${API}/healthz" >/dev/null 2>&1; then
  ok "GET ${API}/healthz responds"
else
  bad "GET ${API}/healthz did not respond (is the backend running on port ${API_PORT}?)"
fi

section "Code execution (the decisive test)"
RESP=$(curl -fsS --max-time 45 -X POST "${API}/api/code/execute" \
  -H 'Content-Type: application/json' \
  -d '{"code":"print(1+1)","language":"python"}' 2>&1)

if [ -z "$RESP" ]; then
  bad "no response from the execute endpoint"
else
  echo "  raw: ${RESP:0:400}"
  echo
  case "$RESP" in
    *'"output":"2"'*)            ok "SANDBOX WORKS — verified generation will function" ;;
    *whitelist*|*'error 401'*)   bad "Piston returns 401 (public API is whitelist-only since 2026-02-15)"
                                 echo "       -> self-host Piston, or fix the Docker executors" ;;
    *'requires Docker'*)         bad "running the UNSANDBOXED in-process fallback"
                                 echo "       -> student code is executing directly on this host" ;;
    *'Docker timeout'*)          bad "Docker executors unreachable; fell through to a dead fallback" ;;
    *)                           warn "unrecognised response — inspect the raw output above" ;;
  esac
fi

section "Summary"
echo "  If the sandbox test failed, verified generation will degrade:"
echo "  tutorials still publish, but code examples ship UNVERIFIED"
echo "  (verification.sandboxDegraded = true in the API response)."
echo
echo "  Fixes are in docs/DEPLOYMENT_EC2.md, Step 3."
