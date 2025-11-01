# Quick Start: Deploy to Your Own Server

This guide will help you quickly deploy the Carrier Dispute System to your own server in 3 steps.

## Prerequisites

- A server with Ubuntu 20.04+ (4GB+ RAM recommended)
- A Git hosting account (GitHub, GitLab, or Bitbucket)
- MySQL database
- AWS S3 account (for file storage)
- OpenAI API key (for AI features)

## Step 1: Push Code to Your Git Repository

### From this Manus environment:

```bash
# Run the setup script
./setup-git-remote.sh

# Follow the prompts to configure your Git remote
# Then push the code
git push deploy master
```

### Manual setup:

```bash
# Add your Git repository as a remote
git remote add deploy https://github.com/YOUR_USERNAME/carrier-dispute-system.git

# Push the code
git push deploy master
```

## Step 2: Setup Your Server

SSH into your server and run:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/carrier-dispute-system.git
cd carrier-dispute-system

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium --with-deps
```

## Step 3: Configure and Start

```bash
# Create .env file (see ENV_SETUP.md for all variables)
nano .env

# Add at minimum:
# DATABASE_URL="mysql://user:pass@localhost:3306/carrier_disputes"
# JWT_SECRET="your_generated_secret"
# AWS_ACCESS_KEY_ID="your_key"
# AWS_SECRET_ACCESS_KEY="your_secret"
# AWS_S3_BUCKET="your-bucket"
# OPENAI_API_KEY="sk-your-key"

# Run database migrations
pnpm run db:push

# Build the application
pnpm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name carrier-dispute-system
pm2 save
pm2 startup  # Follow the instructions

# Or start with systemd (see DEPLOYMENT.md for details)
```

## Step 4: Setup Nginx (Optional but Recommended)

```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/carrier-dispute

# Add (replace your-domain.com):
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
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/carrier-dispute /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Updating Your Deployment

```bash
# Pull latest changes
git pull origin master

# Run the deploy script
./deploy.sh
```

## Need Help?

- **Full deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Environment variables:** See [ENV_SETUP.md](./ENV_SETUP.md)
- **Application docs:** See main [README.md](./README.md)

## Architecture Overview

```
┌─────────────────┐
│   Nginx (80)    │  ← Reverse proxy + SSL
└────────┬────────┘
         │
┌────────▼────────┐
│  Node.js (3000) │  ← Express + tRPC API
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│MySQL │  │  S3  │  ← Database + File Storage
└──────┘  └──────┘
```

## Troubleshooting

### Build fails with memory error
```bash
# Increase Node memory
NODE_OPTIONS='--max-old-space-size=4096' pnpm run build
```

### Port 3000 already in use
```bash
# Change PORT in .env
PORT=3001
```

### Database connection fails
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u your_user -p your_database
```

### Playwright browser issues
```bash
# Reinstall with dependencies
pnpm exec playwright install chromium --with-deps
```

## What's Included

✅ Complete application code with all fixes  
✅ Deployment scripts (`deploy.sh`)  
✅ Git remote setup script (`setup-git-remote.sh`)  
✅ Full deployment guide (`DEPLOYMENT.md`)  
✅ Environment setup guide (`ENV_SETUP.md`)  
✅ All bug fixes applied (pdf-parse removed, delivery proof fixed)  

## Next Steps

1. Push code to your Git repository
2. Setup your server following this guide
3. Configure environment variables
4. Deploy and test
5. Setup monitoring and backups (see DEPLOYMENT.md)

**Your application will be live at: `http://your-domain.com`**
