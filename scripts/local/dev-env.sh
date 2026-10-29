#!/bin/sh
set -eu

repo_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
env_file="$repo_root/.env"
example_file="$repo_root/.env.example"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl é obrigatório para gerar segredos locais de desenvolvimento." >&2
  exit 1
fi

if [ ! -f "$env_file" ]; then
  if [ ! -f "$example_file" ]; then
    echo ".env.example não encontrado; não é possível criar .env." >&2
    exit 1
  fi
  cp "$example_file" "$env_file"
  echo "Criado .env a partir de .env.example."
fi

current_value() {
  key="$1"
  awk -v key="$key" '
    index($0, key "=") == 1 { value = substr($0, length(key) + 2) }
    END { print value }
  ' "$env_file"
}

set_value() {
  key="$1"
  value="$2"
  tmp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$env_file" > "$tmp_file"
  mv "$tmp_file" "$env_file"
}

ensure_secret() {
  key="$1"
  bytes="$2"
  if [ -n "$(current_value "$key")" ]; then
    return 0
  fi
  set_value "$key" "$(openssl rand -hex "$bytes")"
  echo "Gerado $key em .env."
}

ensure_secret JWT_SECRET 32
ensure_secret GF_SECURITY_ADMIN_PASSWORD 16

chmod 600 "$env_file" 2>/dev/null || true
echo "Segredos de desenvolvimento prontos em .env."
