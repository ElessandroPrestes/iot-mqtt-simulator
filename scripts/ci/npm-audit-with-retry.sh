#!/bin/sh
set -eu

max_attempts="${NPM_AUDIT_MAX_ATTEMPTS:-4}"
retry_delay_seconds="${NPM_AUDIT_RETRY_DELAY_SECONDS:-15}"
attempt=1

while [ "$attempt" -le "$max_attempts" ]; do
  if npm audit --omit=dev --audit-level=high; then
    exit 0
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    break
  fi

  echo "npm audit falhou na tentativa ${attempt}; nova tentativa em ${retry_delay_seconds}s"
  sleep "$retry_delay_seconds"
  attempt=$((attempt + 1))
done

echo "npm audit não passou após ${max_attempts} tentativas"
exit 1
