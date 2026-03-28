#!/bin/bash
# md2red Docker entrypoint
# - Symlinks ~/.md2red to /data for persistent storage
# - Wraps headful commands with xvfb-run

# Persistent data directory
mkdir -p /data
ln -sfn /data "$HOME/.md2red"

CMD="$1"

case "$CMD" in
  auth|publish)
    # These need headful Chrome → use Xvfb
    exec xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
      node /app/dist/cli/index.js "$@"
    ;;
  *)
    # Everything else runs fine without display
    exec node /app/dist/cli/index.js "$@"
    ;;
esac
