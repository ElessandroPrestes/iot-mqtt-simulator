#!/bin/sh
set -eu

log_file=/var/log/mongodb/mongod.log
touch "$log_file"
chown 999:999 "$log_file"
chmod 0640 "$log_file"

exec /usr/local/bin/docker-entrypoint.sh "$@"
