#!/bin/sh
set -eu
umask 077

secret_dir="${1:-secrets}"
case "$secret_dir" in
  /*) ;;
  *) secret_dir="$PWD/$secret_dir" ;;
esac
mkdir -p "$secret_dir"
chmod 0700 "$secret_dir"

mongo_user="iotroot"
mongo_password="$(openssl rand -hex 24)"
operator_password="$(openssl rand -hex 24)"

printf '%s' "$mongo_user" > "$secret_dir/mongodb_root_username"
printf '%s' "$mongo_password" > "$secret_dir/mongodb_root_password"
openssl rand -hex 32 > "$secret_dir/jwt_secret"
openssl rand -hex 24 > "$secret_dir/grafana_admin_password"
openssl rand -hex 32 > "$secret_dir/grafana_secret_key"

PRINCIPAL_PASSWORD="$operator_password" \
LOCAL_CREDENTIALS_FILE="${LOCAL_CREDENTIALS_FILE:-}" node -e '
  const argon2 = require("./services/api/node_modules/argon2");
  const crypto = require("crypto");
  const fs = require("fs");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let totpSecret = "";
  for (let offset = 0; offset < bits.length; offset += 5) {
    totpSecret += alphabet[Number.parseInt(bits.slice(offset, offset + 5), 2)];
  }
  argon2.hash(process.env.PRINCIPAL_PASSWORD, { type: argon2.argon2id })
    .then((passwordHash) => {
      process.stdout.write(JSON.stringify([{
        id: "operator-1",
        username: "operator",
        passwordHash,
        role: "operator",
        enabled: true,
        securityAdmin: true,
        totpSecret
      }]));

      if (process.env.LOCAL_CREDENTIALS_FILE) {
        fs.writeFileSync(
          process.env.LOCAL_CREDENTIALS_FILE,
          JSON.stringify({
            username: "operator",
            password: process.env.PRINCIPAL_PASSWORD,
            totpSecret
          }),
          { encoding: "utf8", flag: "wx", mode: 0o600 }
        );
      }
    });
' > "$secret_dir/auth_principals.json"

openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 1 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:nginx" \
  -keyout "$secret_dir/tls_private_key.key" \
  -out "$secret_dir/tls_certificate.crt" 2>/dev/null

openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 1 \
  -subj "/CN=iot-internal-ca" \
  -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -keyout "$secret_dir/internal_ca.key" \
  -out "$secret_dir/internal_ca.crt" 2>/dev/null

issue_certificate() {
  name="$1"
  common_name="$2"
  subject_alt_name="$3"
  extended_key_usage="$4"

  openssl req -new -newkey rsa:3072 -sha256 -nodes \
    -subj "/CN=$common_name" \
    -addext "subjectAltName=$subject_alt_name" \
    -addext "extendedKeyUsage=$extended_key_usage" \
    -keyout "$secret_dir/${name}.key" \
    -out "$secret_dir/${name}.csr" 2>/dev/null
  openssl x509 -req -sha256 -days 1 \
    -in "$secret_dir/${name}.csr" \
    -CA "$secret_dir/internal_ca.crt" \
    -CAkey "$secret_dir/internal_ca.key" \
    -CAcreateserial \
    -copy_extensions copy \
    -out "$secret_dir/${name}.crt" 2>/dev/null
}

issue_certificate api_tls api "DNS:api" serverAuth
issue_certificate dashboard_tls dashboard "DNS:dashboard" serverAuth
issue_certificate broker_tls broker "DNS:broker,DNS:localhost,IP:127.0.0.1" serverAuth
issue_certificate mongo_tls mongo "DNS:mongo,DNS:localhost,IP:127.0.0.1" serverAuth
issue_certificate nginx_client nginx "DNS:nginx" clientAuth
issue_certificate prometheus_client prometheus "DNS:prometheus" clientAuth
issue_certificate prometheus_tls prometheus "DNS:prometheus" serverAuth
issue_certificate api_client api-processor "DNS:api-processor" clientAuth
issue_certificate simulator_client simulator "DNS:simulator" clientAuth
issue_certificate health_client healthcheck "DNS:healthcheck" clientAuth
issue_certificate loki_tls loki "DNS:loki" serverAuth
issue_certificate loki_gateway_tls loki-gateway "DNS:loki-gateway" serverAuth
issue_certificate loki_gateway_client loki-gateway "DNS:loki-gateway" clientAuth
issue_certificate alloy_client alloy "DNS:alloy" clientAuth
issue_certificate grafana_client grafana "DNS:grafana" clientAuth

cat "$secret_dir/mongo_tls.crt" "$secret_dir/mongo_tls.key" \
  > "$secret_dir/mongo_tls.pem"
cat "$secret_dir/health_client.crt" "$secret_dir/health_client.key" \
  > "$secret_dir/health_client.pem"
printf '%s' \
  'mongodb://CN%3Dapi-processor@mongo:27017/iot_dashboard?authSource=%24external&authMechanism=MONGODB-X509&tls=true' \
  > "$secret_dir/mongodb_uri"

rm -f "$secret_dir"/*.csr "$secret_dir/internal_ca.srl"

# Docker Compose implementa secrets locais como bind mounts e não aplica
# uid/gid/mode. O diretório pai 0700 limita acesso no host; os arquivos montados
# precisam ser legíveis pelos UIDs não-root dos containers.
find "$secret_dir" -type f ! -name local_credentials.json -exec chmod 0444 {} +
if [ -f "$secret_dir/local_credentials.json" ]; then
  chmod 0600 "$secret_dir/local_credentials.json"
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  printf 'SECRETS_DIR=%s\n' "$secret_dir" >> "$GITHUB_ENV"
fi
