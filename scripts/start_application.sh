#!/bin/bash

cd /var/www/masonry-ai-frontend

# Stop any existing instance
pm2 stop masonry-ai-frontend || true
pm2 delete masonry-ai-frontend || true

# Start the application with PM2
sudo -u nodejs PM2_HOME=/home/nodejs/.pm2 pm2 start npm --name "masonry-ai-frontend" -- start

# Save PM2 configuration
sudo -u nodejs PM2_HOME=/home/nodejs/.pm2 pm2 save

# Enable PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u nodejs --hp /home/nodejs 