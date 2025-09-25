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

# Use portable Node.js v16.20.2
NODE_PATH="/c/Jarvis/AI Workspace/VeloTicket/nodejs-installation/node-v16.20.2-portable/node-v16.20.2-win-x64"
NPM_PATH="$NODE_PATH"

# Add Node.js to PATH for this session
export PATH="$NODE_PATH:$PATH"

echo "Starting frontend server on http://localhost:3030 with Node.js v16.20.2"
echo "Using portable Node.js from: $NODE_PATH"

# Start the development server with the compatible Node.js version
"$NODE_PATH/node.exe" "$NPM_PATH/npm.cmd" start