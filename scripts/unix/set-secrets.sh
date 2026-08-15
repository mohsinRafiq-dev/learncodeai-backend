#!/usr/bin/env bash
# Interactive helper for setting secrets in the production .env.
#
# Input is hidden and never reaches shell history. Existing values are replaced
# in place; missing keys are appended. A timestamped backup is taken first.
#
# Usage (on the EC2 instance, from the repo root):
#   bash scripts/unix/set-secrets.sh

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

ENV_FILE=".env"
[ -f "$ENV_FILE" ] || { echo "No .env found in $(pwd)"; exit 1; }

BACKUP=".env.backup-$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP"
chmod 600 "$BACKUP"
echo "Backed up current .env to $BACKUP"
echo

# Replace KEY=... in place, or append if absent. Written via a temp file so a
# failure mid-write cannot truncate .env.
set_key() {
  local key="$1" value="$2" tmp
  tmp=$(mktemp)
  if grep -q "^${key}=" "$ENV_FILE"; then
    # awk rather than sed: the value can contain /, &, + and other characters
    # that sed would interpret. Non-matching lines are reprinted verbatim.
    awk -v k="$key" -v v="$value" \
      'index($0, k "=") == 1 { print k "=" v; next } { print }' \
      "$ENV_FILE" > "$tmp"
    echo "  updated existing $key"
  else
    cp "$ENV_FILE" "$tmp"
    printf '\n%s=%s\n' "$key" "$value" >> "$tmp"
    echo "  added new $key"
  fi
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
}

echo "Leave a value blank and press Enter to skip it."
echo

# --- OpenAI (optional) ------------------------------------------------------
echo "1) OPENAI_API_KEY — enables Gemini -> OpenAI failover."
echo "   Get one at https://platform.openai.com/api-keys (starts with sk-)."
echo "   Optional: without it, a Gemini outage means no AI features."
read -r -s -p "   OPENAI_API_KEY: " OPENAI_KEY
echo
if [ -n "$OPENAI_KEY" ]; then
  case "$OPENAI_KEY" in
    sk-*) set_key "OPENAI_API_KEY" "$OPENAI_KEY" ;;
    *)    echo "  WARNING: that does not start with 'sk-'. Setting it anyway."
          set_key "OPENAI_API_KEY" "$OPENAI_KEY" ;;
  esac
else
  echo "  skipped"
fi
echo

# --- Gmail app password -----------------------------------------------------
echo "2) EMAIL_PASS — Gmail app password (16 characters)."
echo "   Generate at https://myaccount.google.com/apppasswords (needs 2FA on)."
echo "   Paste it exactly as Google shows it; spaces are handled for you."
read -r -s -p "   EMAIL_PASS: " EMAIL_PW
echo
if [ -n "$EMAIL_PW" ]; then
  CLEAN=$(printf '%s' "$EMAIL_PW" | tr -d '[:space:]')
  LEN=${#CLEAN}
  if [ "$LEN" -ne 16 ]; then
    echo "  WARNING: got $LEN characters after removing spaces; Gmail app"
    echo "           passwords are 16. Setting it anyway — verify below."
  fi
  set_key "EMAIL_PASS" "$CLEAN"
else
  echo "  skipped"
fi
echo

echo "Current values (masked):"
grep -E '^(OPENAI_API_KEY|GEMINI_API_KEY|EMAIL_USER|EMAIL_PASS)=' "$ENV_FILE" \
  | sed -E 's/=(.{0,4}).*/=\1**** (set)/' | sed 's/^/  /'
echo

read -r -p "Restart the backend now to apply? [y/N] " REPLY
case "$REPLY" in
  [yY]*)
    pm2 restart learncodeai-backend --update-env >/dev/null 2>&1
    echo "Restarting; waiting for readiness..."
    for i in $(seq 1 20); do
      CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:4000/readyz 2>/dev/null)
      [ "$CODE" = "200" ] && { echo "ready after $((i*2))s"; break; }
      sleep 2
    done
    echo
    echo "Email service status:"
    pm2 logs learncodeai-backend --lines 80 --nostream 2>&1 \
      | grep -iE 'email service (initialized|not configured)|535' | tail -3 | sed 's/^/  /'
    echo
    echo "If you see 'Email service initialized successfully', email is fixed."
    echo "If you still see 535, the app password is wrong — regenerate it."
    ;;
  *)
    echo "Not restarted. Apply later with:"
    echo "  pm2 restart learncodeai-backend --update-env"
    ;;
esac

echo
echo "Rollback if something looks wrong:  cp $BACKUP .env"
