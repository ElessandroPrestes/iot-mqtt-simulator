#!/bin/sh
set -eu

repo_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
state_file="$repo_root/.local-secure-runtime"
compose_file="$repo_root/docker-compose.prod.yml"
project_name="iot-local-secure"
public_origin="https://localhost:8443"

runtime_dir=""

load_runtime() {
  if [ ! -f "$state_file" ]; then
    echo "Stack local segura ainda não foi preparada." >&2
    exit 1
  fi

  IFS= read -r runtime_dir < "$state_file"
  case "$runtime_dir" in
    /tmp/iot-mqtt-simulator-local.*) ;;
    *)
      echo "Estado local inválido; recusando operar sobre caminho inesperado." >&2
      exit 1
      ;;
  esac

  if [ ! -d "$runtime_dir" ]; then
    echo "Diretório temporário não existe mais; remova $state_file e execute up." >&2
    exit 1
  fi
}

compose() {
  COMPOSE_PROJECT_NAME="$project_name" \
  PUBLIC_ORIGIN="$public_origin" \
  SECRETS_DIR="$runtime_dir" \
    docker compose -f "$compose_file" "$@"
}

destroy_runtime() {
  case "$runtime_dir" in
    /tmp/iot-mqtt-simulator-local.*)
      find "$runtime_dir" -type f -delete
      find "$runtime_dir" -depth -type d -empty -delete
      ;;
    *)
      echo "Caminho temporário inesperado; cleanup recusado." >&2
      exit 1
      ;;
  esac
  rm -f "$state_file"
}

up() {
  if [ -f "$state_file" ]; then
    load_runtime
    echo "Reutilizando lifecycle local já preparado."
  else
    runtime_dir="$(mktemp -d /tmp/iot-mqtt-simulator-local.XXXXXX)"
    chmod 0700 "$runtime_dir"
    printf '%s\n' "$runtime_dir" > "$state_file"

    if ! (
      cd "$repo_root"
      LOCAL_CREDENTIALS_FILE="$runtime_dir/local_credentials.json" \
        ./scripts/ci/prepare-dast-secrets.sh "$runtime_dir"
    ); then
      destroy_runtime
      exit 1
    fi
  fi

  if ! compose up -d --build; then
    compose down --volumes || true
    destroy_runtime
    exit 1
  fi
  echo "Stack local segura iniciada em $public_origin"
  echo "Use 'make local-credentials' para obter o login efêmero."
}

down() {
  load_runtime
  echo "Atenção: o teardown remove containers, volumes e todos os secrets locais."
  compose down --volumes
  destroy_runtime
  echo "Stack, dados efêmeros e secrets locais destruídos."
}

credentials() {
  load_runtime
  credentials_file="$runtime_dir/local_credentials.json"
  if [ ! -f "$credentials_file" ]; then
    echo "Credenciais locais não encontradas." >&2
    exit 1
  fi

  node - "$credentials_file" "$repo_root" <<'NODE'
const fs = require('fs');
const path = require('path');
const credentials = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const { generateTotp } = require(path.join(
  process.argv[3],
  'services/api/src/utils/totp'
));

process.stdout.write([
  `Usuário: ${credentials.username}`,
  `Senha: ${credentials.password}`,
  `TOTP atual: ${generateTotp(credentials.totpSecret)}`,
  'O TOTP muda a cada 30 segundos.'
].join('\n') + '\n');
NODE
}

status() {
  load_runtime
  compose ps
}

logs() {
  load_runtime
  compose logs --tail=100
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  credentials) credentials ;;
  status) status ;;
  logs) logs ;;
  *)
    echo "Uso: $0 {up|down|credentials|status|logs}" >&2
    exit 2
    ;;
esac
