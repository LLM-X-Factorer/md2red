#!/bin/bash
# md2red Docker entrypoint
# - Symlinks ~/.md2red to /data for persistent storage
# - Web mode: starts web console under Xvfb
# - CLI mode: wraps headful commands with Xvfb

# Persistent data directory
mkdir -p /data
ln -sfn /data "$HOME/.md2red"

CMD="$1"

case "$CMD" in
  web)
    # Web console — always needs Xvfb (generate + publish use Chrome)
    exec xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
      node /app/dist/web/server.js
    ;;
  auth|publish)
    # CLI headful commands
    exec xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
      node /app/dist/cli/index.js "$@"
    ;;
  *)
    # CLI headless commands
    exec node /app/dist/cli/index.js "$@"
    ;;
esac
