#!/bin/bash
# md2red Docker entrypoint

# Persistent data directory
mkdir -p /data /data/uploads /data/output
ln -sfn /data "$HOME/.md2red"
export MD2RED_DATA_DIR=/data

CMD="$1"

case "$CMD" in
  web)
    exec node /app/dist/web/server.js
    ;;
  *)
    exec node /app/dist/cli/index.js "$@"
    ;;
esac
