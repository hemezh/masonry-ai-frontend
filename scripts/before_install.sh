#!/bin/bash

# Update system packages
sudo yum update -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Create nodejs user and group if they don't exist
if ! id "nodejs" &>/dev/null; then
    sudo useradd -r -m -U -d /home/nodejs -s /bin/bash nodejs
fi

# Create application directory if it doesn't exist
sudo mkdir -p /var/www/masonry-ai-frontend
sudo chown -R nodejs:nodejs /var/www/masonry-ai-frontend

# Clean up existing files if any
sudo rm -rf /var/www/masonry-ai-frontend/* 