#!/bin/bash

cd /c/Jarvis/AI\ Workspace/VeloTicket/frontend
export NODE_OPTIONS="--openssl-legacy-provider"
export HOST=localhost
export PORT=3030
export BROWSER=none

# Start the server in the foreground
npm start