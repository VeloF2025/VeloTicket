#!/bin/bash

echo "Starting VeloTicket Application..."

# Start backend server
echo "Starting backend server on port 8080..."
cd /c/Jarvis/AI\ Workspace/VeloTicket/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Build and start frontend
echo "Building and starting frontend server on port 3030..."
cd /c/Jarvis/AI\ Workspace/VeloTicket/frontend

# Build React app
echo "Building React app..."
NODE_OPTIONS="--openssl-legacy-provider" npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Starting frontend production server..."
    NODE_PATH="/c/Jarvis/AI Workspace/VeloTicket/nodejs-installation/node-v16.20.2-portable/node-v16.20.2-win-x64"
    PORT=3030 "$NODE_PATH/node.exe" prod-server.js &
    FRONTEND_PID=$!

    echo ""
    echo "🎉 VeloTicket is now running!"
    echo "📱 Frontend: http://localhost:3030"
    echo "🔧 Backend API: http://localhost:8080"
    echo ""
    echo "To stop the servers, run:"
    echo "kill $BACKEND_PID $FRONTEND_PID"

    # Keep the script running
    wait
else
    echo "❌ Frontend build failed!"
    kill $BACKEND_PID
    exit 1
fi