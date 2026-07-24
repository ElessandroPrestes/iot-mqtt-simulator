#!/bin/sh
set -eu

log_dir=/mosquitto/log
log_file="$log_dir/mosquitto.log"

chown 0:1883 "$log_dir"
if [ ! -e "$log_file" ]; then
  touch "$log_file"
  chown 1883:1883 "$log_file"
fi
chmod 0640 "$log_file"
chown 1883:1883 "$log_dir"

exec /docker-entrypoint.sh "$@"
