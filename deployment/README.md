# TigerSpot AWS Deployment Guide

This guide covers deploying TigerSpot on AWS with CI/CD:

- **GitHub Actions** for automated CI/CD

- **EC2** for the SvelteKit frontend + Express backend
- **RDS** for PostgreSQL database
- **Nginx** as reverse proxy with SSL via Let's Encrypt

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │              EC2 Instance               │
                    │                                         │
Internet ──────────▶│  Nginx (80/443)                        │
                    │    │                                    │
                    │    ├──▶ Frontend (localhost:3000)       │
                    │    │    SvelteKit                       │
                    │    │                                    │
                    │    └──▶ Backend (localhost:4000)        │
                    │         Express API                     │
                    │              │                          │
                    └──────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────────┐
                    │         RDS PostgreSQL                  │
                    └─────────────────────────────────────────┘
```

## Prerequisites

- AWS Account
- Domain name (pointed to your EC2's IP)
- SSH key pair for EC2
- GitHub repository with Actions enabled

## System Dependencies

The image service requires these system packages to be installed on the server:

| Package       | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `perl`        | Required by `exiftool-vendored` for EXIF/GPS extraction from images (including HEIC) |
| `libvips-dev` | Required by `sharp` for image processing and conversion                              |

These are installed automatically by the `setup.sh` script. If setting up manually, run:

```bash
sudo apt install -y perl libvips-dev
```

---

## CI/CD with GitHub Actions

TigerSpot uses GitHub Actions for automated testing and deployment:

```
Push/PR → CI (lint, typecheck, build) → Deploy (on main only)
                    ↓                           ↓
           GitHub-hosted runner          Self-hosted runner (EC2)
```

### CI Pipeline

Every push and pull request triggers:

- **Lint**: Prettier format check
- **Typecheck**: Frontend (svelte-check) + Backend (tsc)
- **Build**: Verify frontend builds successfully

### Automatic Deployment

Pushes to `main` that pass CI automatically deploy to production.

### Setup Instructions

#### 1. Copy workflow files

```bash
mkdir -p .github/workflows
cp deployment/github-actions/ci.yml .github/workflows/
cp deployment/github-actions/deploy.yml .github/workflows/
```

#### 2. Set up self-hosted runner on EC2

1. Go to your GitHub repo → **Settings** → **Actions** → **Runners**
2. Click **New self-hosted runner** → Select **Linux**
3. SSH into your EC2 instance and run the provided commands:

```bash
# Create a folder for the runner
mkdir ~/actions-runner && cd ~/actions-runner

# Download and extract (get latest URL from GitHub)
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz

# Configure (use the token from GitHub)
./config.sh --url https://github.com/YOUR_ORG/tigerspot --token YOUR_TOKEN

# Install and start as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### 3. Make deploy script executable

```bash
chmod +x deployment/deploy.sh
```

#### 4. Test the pipeline

1. Create a PR and verify CI checks pass
2. Merge to main and verify automatic deployment

### Manual Deployment

If needed, you can still deploy manually:

```bash
ssh ubuntu@YOUR_EC2_IP
cd ~/tigerspot
./deployment/deploy.sh
```

### Rollback

To rollback to a previous version:

```bash
cd ~/tigerspot
git checkout <previous-commit-sha>
pm2 reload all
```

Or revert the commit and push:

```bash
git revert HEAD
git push origin main
```

---

## Step 1: Create RDS PostgreSQL Database

### 1.1 Create the Database

1. Go to **AWS Console → RDS → Create database**
2. Choose:
   - **Engine**: PostgreSQL
   - **Version**: 15.x or 16.x
   - **Template**: Free tier (for testing) or Production
   - **DB instance identifier**: `tigerspot-db`
   - **Master username**: `postgres`
   - **Master password**: (save this!)
   - **Instance class**: `db.t3.micro` (free tier) or `db.t3.small`
   - **Storage**: 20 GB gp2
   - **VPC**: Default VPC
   - **Public access**: Yes (for initial setup, can restrict later)
   - **Database name**: `tigerspot`

3. Click **Create database** (takes ~5 minutes)

### 1.2 Configure Security Group

1. Go to your RDS instance → **Security** → Click on the security group
2. Edit **Inbound rules**:
   - Add rule: **PostgreSQL (5432)** from your EC2's security group (or IP)

### 1.3 Get Connection String

Your connection string will be:

```
postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/tigerspot?schema=public
```

Find your endpoint in RDS → Databases → tigerspot-db → **Endpoint**

---

## Step 2: Launch EC2 Instance

### 2.1 Create the Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name**: `tigerspot-server`
   - **AMI**: Ubuntu Server 24.04 LTS (or 22.04)
   - **Instance type**: `t3.small` (2 vCPU, 2 GB RAM) - recommended
   - **Key pair**: Create or select existing
   - **Network settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
   - **Storage**: 20 GB gp3

3. Click **Launch instance**

### 2.2 Allocate Elastic IP (Recommended)

1. Go to **EC2 → Elastic IPs → Allocate**
2. Associate with your instance

This ensures your IP doesn't change when you stop/start the instance.

### 2.3 Point Your Domain

In your DNS provider (Route 53, Cloudflare, etc.):

- Create an **A record** pointing `yourdomain.com` → Your EC2 Elastic IP
- Create an **A record** pointing `www.yourdomain.com` → Your EC2 Elastic IP

---

## Step 3: Set Up EC2 Instance

### 3.1 SSH into Your Instance

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 3.2 Run Setup Script

Upload and run the setup script, or run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm, PM2
sudo npm install -g pnpm pm2

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx git

# Install image processing dependencies
# - perl: Required by exiftool-vendored for EXIF extraction from images
# - libvips-dev: Required by sharp for image processing
sudo apt install -y perl libvips-dev

# Create directories
mkdir -p ~/logs ~/tigerspot
```

### 3.3 Clone Your Repository

```bash
cd ~/tigerspot
git clone https://github.com/TigerAppsOrg/tigerspot.git .
# Or use deploy keys for private repos
```

### 3.4 Set Up Environment Variables

**Backend (.env):**

```bash
nano ~/tigerspot/apps/server/.env
```

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/tigerspot?schema=public"
JWT_SECRET="generate-a-secure-random-string"
PORT=4000
NODE_ENV=production
FRONTEND_URL="https://yourdomain.com"
CAS_SERVICE_URL="https://yourdomain.com/api/auth/cas/callback"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Frontend (.env):**

```bash
nano ~/tigerspot/apps/frontend/.env
```

```env
PUBLIC_API_URL=""
```

### 3.5 Install Dependencies and Build

```bash
# Install all dependencies from root
cd ~/tigerspot
pnpm install

# Backend
cd ~/tigerspot/apps/server
pnpm prisma generate
pnpm prisma migrate deploy  # Run database migrations
pnpm build

# Frontend
cd ~/tigerspot/apps/frontend
pnpm build
```

---

## Step 4: Configure Nginx

### 4.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/tigerspot
```

Paste this configuration (replace `YOUR_DOMAIN.com`):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # Frontend (SvelteKit)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/tigerspot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 5: Set Up SSL with Certbot

```bash
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

Follow the prompts:

- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

Certbot will:

- Obtain a free Let's Encrypt certificate
- Automatically configure Nginx for HTTPS
- Set up auto-renewal

### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## Step 6: Start Applications with PM2

### 6.1 Copy PM2 Config

```bash
cp ~/tigerspot/deployment/ecosystem.config.cjs ~/ecosystem.config.cjs
```

### 6.2 Start Applications

```bash
cd ~
pm2 start ecosystem.config.cjs
```

### 6.3 Verify Apps Are Running

```bash
pm2 status
pm2 logs  # View logs (Ctrl+C to exit)
```

### 6.4 Enable Startup on Reboot

```bash
pm2 save
pm2 startup
# Copy and run the command it outputs
```

---

## Step 7: Verify Deployment

1. Visit `https://yourdomain.com` - should see the frontend
2. Visit `https://yourdomain.com/api/health` - should see API response
3. Try logging in with Princeton CAS

---

## Maintenance Commands

### View Logs

```bash
pm2 logs                    # All logs
pm2 logs tigerspot-frontend # Frontend only
pm2 logs tigerspot-backend  # Backend only
```

### Restart Applications

```bash
pm2 restart all
pm2 restart tigerspot-frontend
pm2 restart tigerspot-backend
```

### Deploy Updates

```bash
cd ~/tigerspot
git pull
pnpm install

# Rebuild frontend
cd apps/frontend
pnpm build

# Rebuild backend (if needed)
cd ../server
pnpm build
pnpm prisma migrate deploy  # If there are new migrations

# Restart
pm2 restart all
```

### Check SSL Certificate

```bash
sudo certbot certificates
```

### Renew SSL (automatic, but can force)

```bash
sudo certbot renew
```

---

## Troubleshooting

### App not starting

```bash
pm2 logs --lines 100  # Check recent logs
```

### Nginx errors

```bash
sudo nginx -t                    # Test config
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues

```bash
# Test connection from EC2
psql "postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/tigerspot"

# Check RDS security group allows EC2's IP/security group
```

### Check ports are listening

```bash
sudo netstat -tlnp | grep -E '3000|4000|80|443'
```

### Image processing errors

If you see errors related to EXIF extraction or image processing:

```bash
# Ensure Perl is installed (required by exiftool-vendored)
perl -v

# Ensure libvips is installed (required by sharp)
vips --version

# If missing, install them:
sudo apt install -y perl libvips-dev

# Then reinstall npm dependencies to rebuild native modules
cd ~/tigerspot
pnpm install --force
```

---

## Cost Estimate (Monthly)

| Service       | Size            | Cost           |
| ------------- | --------------- | -------------- |
| EC2           | t3.small        | ~$15           |
| RDS           | db.t3.micro     | ~$15           |
| Elastic IP    | (when attached) | Free           |
| Data Transfer | First 100GB     | Free           |
| **Total**     |                 | **~$30/month** |

---

## Security Recommendations

1. **RDS**: After initial setup, consider disabling public access and only allowing connections from EC2's security group
2. **SSH**: Restrict SSH access to your IP only in the security group
3. **Secrets**: Consider using AWS Secrets Manager for sensitive values
4. **Backups**: Enable RDS automated backups
5. **Monitoring**: Set up CloudWatch alarms for CPU/memory
