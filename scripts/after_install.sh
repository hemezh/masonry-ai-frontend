#!/bin/bash

cd /var/www/masonry-ai-frontend

# Install dependencies
npm ci

# Build the Next.js application
npm run build

# Set proper permissions
sudo chown -R nodejs:nodejs /var/www/masonry-ai-frontend 