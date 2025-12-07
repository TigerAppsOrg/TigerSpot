#!/bin/bash
# TigerSpot EC2 Setup Script
# Run this on a fresh Ubuntu 22.04/24.04 EC2 instance
# Usage: chmod +x setup.sh && ./setup.sh

set -e

echo "=== TigerSpot EC2 Setup ==="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
echo "Installing pnpm..."
sudo npm install -g pnpm

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install Git
echo "Installing Git..."
sudo apt install -y git

# Create logs directory
echo "Creating logs directory..."
mkdir -p ~/logs

# Create app directory
echo "Creating app directory..."
mkdir -p ~/tigerspot

echo ""
echo "=== Base installation complete! ==="
echo ""
echo "Next steps:"
echo "1. Clone your repository: cd ~/tigerspot && git clone <your-repo-url> ."
echo "2. Set up environment variables (see README.md)"
echo "3. Install dependencies: cd tigerspot-new && pnpm install && cd ../server && pnpm install"
echo "4. Build frontend: cd ~/tigerspot/tigerspot-new && pnpm build"
echo "5. Run database migrations: cd ~/tigerspot/server && pnpm prisma migrate deploy"
echo "6. Configure Nginx (see README.md)"
echo "7. Start apps with PM2"
echo "8. Set up SSL with Certbot"
