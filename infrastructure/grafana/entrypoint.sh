#!/bin/sh
set -eu

LOKI_CA_PEM="$(cat /run/secrets/internal_ca)"
LOKI_CLIENT_CERT_PEM="$(cat /run/secrets/grafana_client_cert)"
LOKI_CLIENT_KEY_PEM="$(cat /run/secrets/grafana_client_key)"
export LOKI_CA_PEM LOKI_CLIENT_CERT_PEM LOKI_CLIENT_KEY_PEM

exec /run.sh
