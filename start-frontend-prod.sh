#!/bin/bash

cd /c/Jarvis/AI\ Workspace/VeloTicket/frontend

# Build the React app with OpenSSL legacy provider
echo "Building React app..."
NODE_OPTIONS="--openssl-legacy-provider" npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Starting production server..."
    # Start the production server
    NODE_PATH="/c/Jarvis/AI Workspace/VeloTicket/nodejs-installation/node-v16.20.2-portable/node-v16.20.2-win-x64"
    PORT=3030 "$NODE_PATH/node.exe" prod-server.js
else
    echo "Build failed!"
    exit 1
fi