#!/bin/bash

cd /var/www/masonry-ai-frontend

# Install dependencies
pnpm install --frozen-lockfile

# Build the Next.js application
pnpm run build

# Set proper permissions
sudo chown -R nodejs:nodejs /var/www/masonry-ai-frontend 