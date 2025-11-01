# Deployment Guide - Carrier Dispute System

This guide explains how to deploy the Carrier Dispute System to your own server using Git-based deployment.

## Overview

The application is a full-stack Node.js application with:
- **Frontend:** React 19 + Vite
- **Backend:** Express + tRPC
- **Database:** MySQL 8.0+
- **File Storage:** AWS S3
- **Browser Automation:** Playwright

## Prerequisites

### Server Requirements
- **OS:** Ubuntu 20.04+ or similar Linux
- **RAM:** 4-6GB minimum (8GB recommended)
- **CPU:** 2-4 cores
- **Storage:** 20-40GB
- **Node.js:** v22.x
- **pnpm:** v10.x
- **MySQL:** 8.0+

### External Services
You'll need API keys for:
- AWS S3 (file storage)
- OpenAI (AI features)
- ShipStation (optional - carrier sync)
- WooCommerce (optional - e-commerce)
- Klaviyo (optional - email marketing)
- Google Sheets API (optional - data import)

## Step 1: Push Code to Your Git Repository

### Option A: GitHub
```bash
# Create a new repository on GitHub, then:
git remote add deploy https://github.com/YOUR_USERNAME/carrier-dispute-system.git
git push deploy master
```

### Option B: GitLab
```bash
git remote add deploy https://gitlab.com/YOUR_USERNAME/carrier-dispute-system.git
git push deploy master
```

### Option C: Bitbucket
```bash
git remote add deploy https://bitbucket.org/YOUR_USERNAME/carrier-dispute-system.git
git push deploy master
```

### Option D: Self-hosted Git
```bash
git remote add deploy ssh://git@your-server.com/repo.git
git push deploy master
```

## Step 2: Server Setup

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Playwright dependencies
sudo apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

### Clone Repository

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/carrier-dispute-system.git
cd carrier-dispute-system

# Set permissions
sudo chown -R $USER:$USER /var/www/carrier-dispute-system
```

### Install Application Dependencies

```bash
pnpm install
```

### Install Playwright Browsers

```bash
pnpm exec playwright install chromium
```

## Step 3: Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE carrier_disputes;
CREATE USER 'carrier_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON carrier_disputes.* TO 'carrier_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 4: Environment Configuration

Create `.env` file in the project root:

```bash
# Database
DATABASE_URL="mysql://carrier_app:your_secure_password@localhost:3306/carrier_disputes"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your_jwt_secret_here"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-key"

# Application
NODE_ENV="production"
PORT="3000"
VITE_APP_TITLE="Catch The Fever - Carrier Dispute System"
VITE_APP_LOGO="/logo.png"

# OAuth (if using Manus auth, otherwise implement your own)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# Owner Info
OWNER_NAME="Your Name"
OWNER_EMAIL="your@email.com"

# Optional: ShipStation
SHIPSTATION_API_KEY="your_key"
SHIPSTATION_API_SECRET="your_secret"

# Optional: WooCommerce
WOOCOMMERCE_STORE_URL="https://your-store.com"
WOOCOMMERCE_CONSUMER_KEY="your_key"
WOOCOMMERCE_CONSUMER_SECRET="your_secret"

# Optional: Klaviyo
KLAVIYO_PRIVATE_KEY="your_key"

# Optional: Google Sheets
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

## Step 5: Database Migration

```bash
# Run database migrations
pnpm run db:push
```

## Step 6: Build Application

```bash
# Build frontend and backend
pnpm run build
```

## Step 7: Start Application

### Option A: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name carrier-dispute-system

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions from the command output

# Monitor application
pm2 logs carrier-dispute-system
pm2 status
```

### Option B: Using systemd

Create `/etc/systemd/system/carrier-dispute.service`:

```ini
[Unit]
Description=Carrier Dispute System
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/carrier-dispute-system
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/carrier-dispute-system/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable carrier-dispute
sudo systemctl start carrier-dispute
sudo systemctl status carrier-dispute
```

## Step 8: Setup Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/carrier-dispute`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100M;

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
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/carrier-dispute /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Step 10: Setup Auto-Deployment (Optional)

Create deployment script `/var/www/carrier-dispute-system/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin master

# Install dependencies
pnpm install

# Run migrations
pnpm run db:push

# Build application
pnpm run build

# Restart application
pm2 restart carrier-dispute-system

echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

### Setup Git Webhook (GitHub Example)

1. Go to your GitHub repository settings
2. Click "Webhooks" → "Add webhook"
3. Set Payload URL to: `https://your-domain.com/api/deploy`
4. Set Content type to: `application/json`
5. Set Secret to a random string
6. Select "Just the push event"

Then create a webhook endpoint in your application to trigger `deploy.sh` when receiving the webhook.

## Updating the Application

```bash
cd /var/www/carrier-dispute-system
./deploy.sh
```

Or manually:

```bash
git pull origin master
pnpm install
pnpm run db:push
pnpm run build
pm2 restart carrier-dispute-system
```

## Monitoring

### View Logs

```bash
# PM2 logs
pm2 logs carrier-dispute-system

# Systemd logs
sudo journalctl -u carrier-dispute -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor Resources

```bash
pm2 monit
htop
```

## Backup

### Database Backup

```bash
# Create backup script
cat > /var/www/carrier-dispute-system/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u carrier_app -p carrier_disputes > /var/backups/carrier_disputes_$DATE.sql
# Keep only last 7 days
find /var/backups -name "carrier_disputes_*.sql" -mtime +7 -delete
EOF

chmod +x /var/www/carrier-dispute-system/backup-db.sh

# Setup daily backup cron
sudo crontab -e
# Add: 0 2 * * * /var/www/carrier-dispute-system/backup-db.sh
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs carrier-dispute-system --lines 100

# Check environment variables
cat .env

# Check database connection
mysql -u carrier_app -p carrier_disputes
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill if needed
sudo kill -9 <PID>
```

### Playwright browser issues
```bash
# Reinstall browsers
pnpm exec playwright install chromium --with-deps
```

### Database migration errors
```bash
# Reset and re-run migrations
pnpm run db:push
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Setup firewall (ufw)
- [ ] Enable SSL/HTTPS
- [ ] Secure MySQL (run mysql_secure_installation)
- [ ] Set proper file permissions
- [ ] Keep system updated
- [ ] Setup automated backups
- [ ] Monitor logs regularly
- [ ] Use strong JWT_SECRET
- [ ] Restrict database access to localhost

## Support

For issues specific to the application code, refer to the main README.md and codebase documentation.
