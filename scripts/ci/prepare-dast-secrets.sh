#!/bin/sh
set -eu

secret_dir="${1:-secrets}"
case "$secret_dir" in
  /*) ;;
  *) secret_dir="$PWD/$secret_dir" ;;
esac
mkdir -p "$secret_dir"

mongo_user="iotroot"
mongo_password="$(openssl rand -hex 24)"
mqtt_api_password="$(openssl rand -hex 24)"
mqtt_simulator_password="$(openssl rand -hex 24)"
mqtt_health_password="$(openssl rand -hex 24)"
operator_password="$(openssl rand -hex 24)"

printf '%s' "$mongo_user" > "$secret_dir/mongodb_root_username"
printf '%s' "$mongo_password" > "$secret_dir/mongodb_root_password"
printf 'mongodb://%s:%s@mongo:27017/iot_dashboard?authSource=admin' \
  "$mongo_user" "$mongo_password" > "$secret_dir/mongodb_uri"
printf '%s' "api-processor" > "$secret_dir/mqtt_api_username"
printf '%s' "$mqtt_api_password" > "$secret_dir/mqtt_api_password"
printf '%s' "simulator" > "$secret_dir/mqtt_simulator_username"
printf '%s' "$mqtt_simulator_password" > "$secret_dir/mqtt_simulator_password"
printf '%s' "healthcheck" > "$secret_dir/mqtt_health_username"
printf '%s' "$mqtt_health_password" > "$secret_dir/mqtt_health_password"
openssl rand -hex 32 > "$secret_dir/jwt_secret"
openssl rand -hex 24 > "$secret_dir/grafana_admin_password"

PRINCIPAL_PASSWORD="$operator_password" node -e '
  const argon2 = require("./services/api/node_modules/argon2");
  argon2.hash(process.env.PRINCIPAL_PASSWORD, { type: argon2.argon2id })
    .then((passwordHash) => process.stdout.write(JSON.stringify([{
      id: "operator-1",
      username: "operator",
      passwordHash,
      role: "operator",
      enabled: true
    }])));
' > "$secret_dir/auth_principals.json"

docker run --rm --user "$(id -u):$(id -g)" \
  --volume "$secret_dir:/work" \
  eclipse-mosquitto:2.0@sha256:212f89e1eaeb2c322d6441b64396e3346026674db8fa9c27beac293405c32b3c \
  mosquitto_passwd -b -c /work/mosquitto_password_file api-processor "$mqtt_api_password"
docker run --rm --user "$(id -u):$(id -g)" \
  --volume "$secret_dir:/work" \
  eclipse-mosquitto:2.0@sha256:212f89e1eaeb2c322d6441b64396e3346026674db8fa9c27beac293405c32b3c \
  mosquitto_passwd -b /work/mosquitto_password_file simulator "$mqtt_simulator_password"
docker run --rm --user "$(id -u):$(id -g)" \
  --volume "$secret_dir:/work" \
  eclipse-mosquitto:2.0@sha256:212f89e1eaeb2c322d6441b64396e3346026674db8fa9c27beac293405c32b3c \
  mosquitto_passwd -b /work/mosquitto_password_file healthcheck "$mqtt_health_password"

openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 1 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:nginx" \
  -keyout "$secret_dir/tls_private_key.key" \
  -out "$secret_dir/tls_certificate.crt"

# Docker Compose implementa secrets locais como bind mounts e não aplica
# uid/gid/mode. O runner DAST é efêmero e exclusivo; leitura no container exige
# que os arquivos sejam world-readable durante este job.
chmod 0444 "$secret_dir"/*
