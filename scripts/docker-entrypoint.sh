#!/bin/bash
# md2red Docker entrypoint

# Persistent data directory
mkdir -p /data /data/uploads /data/output
ln -sfn /data "$HOME/.md2red"
export MD2RED_DATA_DIR=/data

# Start Xvfb in background (needed for headful Chrome)
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &
export DISPLAY=:99

# Wait for Xvfb to be ready
sleep 1

CMD="$1"

case "$CMD" in
  web)
    exec node /app/dist/web/server.js
    ;;
  auth|publish)
    exec node /app/dist/cli/index.js "$@"
    ;;
  *)
    exec node /app/dist/cli/index.js "$@"
    ;;
esac
