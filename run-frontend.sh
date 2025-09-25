#!/bin/bash

# Kill any existing node processes on port 3030
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

cd /c/Jarvis/AI\ Workspace/VeloTicket/frontend

# Set environment variables for compatibility
export NODE_OPTIONS="--openssl-legacy-provider --no-warnings"
export HOST=localhost
export PORT=3030
export BROWSER=none
export ESLINT_NO_DEV_ERRORS=true

# Start the development server
echo "Starting frontend server on http://localhost:3030"
npm start