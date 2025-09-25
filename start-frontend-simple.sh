#!/bin/bash

cd /c/Jarvis/AI\ Workspace/VeloTicket/frontend

# Use portable Node.js v16.20.2
NODE_PATH="/c/Jarvis/AI Workspace/VeloTicket/nodejs-installation/node-v16.20.2-portable/node-v16.20.2-win-x64"

echo "Starting frontend server with Node.js v16.20.2"
echo "Using portable Node.js from: $NODE_PATH"

# Start the development server
cd "/c/Jarvis/AI Workspace/VeloTicket/frontend" && "$NODE_PATH/npm.cmd" start