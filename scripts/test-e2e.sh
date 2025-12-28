#!/bin/bash

# Start the server in the background if not already running
if ! curl -s -o /dev/null http://localhost:3000/login; then
  echo "Starting server..."
  bun run dev > e2e-server.log 2>&1 &
  SERVER_PID=$!
  
  echo "Waiting for server to be ready..."
  for i in {1..60}; do
    if curl -s -o /dev/null http://localhost:3000/login; then
      echo "Server is up!"
      SERVER_STARTED=true
      break
    fi
    sleep 2
    echo -n "."
  done
  
  if [ -z "$SERVER_STARTED" ]; then
    echo "Server failed to start within timeout."
    kill $SERVER_PID
    exit 1
  fi
else
  echo "Server is already running."
fi

# Run Playwright tests
echo "Running E2E tests..."
bun x playwright test "$@"

# Cleanup: Kill the server if we started it
if [ "$SERVER_STARTED" = true ]; then
  echo "Stopping server (PID: $SERVER_PID)..."
  kill $SERVER_PID
fi
