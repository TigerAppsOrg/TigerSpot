#!/bin/bash
# TigerSpot Deployment Script
# Executed by GitHub Actions self-hosted runner on EC2
#
# Usage: ./deployment/deploy.sh

set -e

APP_DIR="${APP_DIR:-$HOME/tigerspot}"

echo "=== TigerSpot Deployment Started ==="
echo "Deploying to: $APP_DIR"
echo ""

# Navigate to app directory
cd "$APP_DIR"

# Pull latest code
echo ">>> Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo ">>> Installing dependencies..."
pnpm install --frozen-lockfile -r

# Backend: Generate Prisma client and run migrations
echo ">>> Running database migrations..."
cd apps/server
pnpm i
cd ../../
pnpm db:generate
pnpm db:migrate

# Backend: Build TypeScript
echo ">>> Building backend..."
cd apps/server
pnpm build

# Frontend: Build SvelteKit
echo ">>> Building frontend..."
cd ../frontend
pnpm i
pnpm build

# Restart PM2 with zero-downtime reload
echo ">>> Restarting applications..."
pm2 reload all --update-env

echo ""
echo "=== Deployment Complete ==="
pm2 status
