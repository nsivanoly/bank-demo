#!/bin/bash

URL="ws://web-socket:8081/stream"  # Docker Compose internal hostname
TIMEOUT=5

if timeout "$TIMEOUT" wscat -c "$URL" -x "ping" >/dev/null 2>&1; then
  exit 0
else
  exit 1
fi
