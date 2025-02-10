#!/bin/bash

# Wait for the application to start
sleep 10

# Check if the process is running
if sudo -u nodejs PM2_HOME=/home/nodejs/.pm2 pm2 status | grep -q "masonry-ai-frontend"; then
    # Check if the application is responding
    if curl -f "http://localhost:3000/health" > /dev/null 2>&1; then
        echo "Application is running and responding"
        exit 0
    else
        echo "Application is not responding"
        exit 1
    fi
else
    echo "Application is not running"
    exit 1
fi 