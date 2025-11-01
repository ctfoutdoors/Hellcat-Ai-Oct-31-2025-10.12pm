# Environment Variables Setup Guide

This document lists all environment variables needed to run the Carrier Dispute System on your own server.

## Required Environment Variables

### Database
```bash
DATABASE_URL="mysql://username:password@localhost:3306/carrier_disputes"
```

### Application
```bash
NODE_ENV="production"
PORT="3000"
```

### Security
```bash
# Generate with: openssl rand -base64 32
JWT_SECRET="your_generated_secret_here"
```

### AWS S3 (File Storage)
```bash
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

### OpenAI (AI Features)
```bash
OPENAI_API_KEY="sk-your-api-key"
```

### Application Branding
```bash
VITE_APP_TITLE="Catch The Fever - Carrier Dispute System"
VITE_APP_LOGO="/logo.png"
VITE_APP_ID="your_app_id"
```

### Owner Information
```bash
OWNER_NAME="Your Name"
OWNER_EMAIL="your@email.com"
OWNER_OPEN_ID="your_unique_id"
```

## Optional Environment Variables

### OAuth (if using Manus authentication)
```bash
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
```

### ShipStation Integration
```bash
SHIPSTATION_API_KEY="your_key"
SHIPSTATION_API_SECRET="your_secret"
SHIPSTATION_API_V2_KEY="your_v2_key"
```

### WooCommerce Integration
```bash
WOOCOMMERCE_STORE_URL="https://your-store.com"
WOOCOMMERCE_CONSUMER_KEY="ck_your_key"
WOOCOMMERCE_CONSUMER_SECRET="cs_your_secret"
```

### Klaviyo Integration
```bash
KLAVIYO_PRIVATE_KEY="your_private_key"
```

### Reamaze Integration
```bash
REAMAZE_API_KEY="your_api_key"
REAMAZE_BRAND="your_brand"
```

### Analytics
```bash
VITE_ANALYTICS_WEBSITE_ID="your_website_id"
VITE_ANALYTICS_ENDPOINT="https://analytics.example.com"
```

### Built-in Forge API (Manus Services)
```bash
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your_forge_key"
```

## How to Set Up

1. Copy this template to `.env` in your project root
2. Replace all placeholder values with your actual credentials
3. Never commit `.env` to version control (it's in .gitignore)
4. Keep `.env` secure with proper file permissions: `chmod 600 .env`

## Generating Secrets

### JWT Secret
```bash
openssl rand -base64 32
```

### Random App ID
```bash
openssl rand -hex 16
```

## Getting API Keys

- **AWS S3:** https://console.aws.amazon.com/iam/
- **OpenAI:** https://platform.openai.com/api-keys
- **ShipStation:** https://ship11.shipstation.com/settings/api
- **WooCommerce:** Your store → Settings → Advanced → REST API
- **Klaviyo:** https://www.klaviyo.com/account#api-keys-tab
- **Reamaze:** https://app.reamaze.com/settings/api

## Security Best Practices

1. Use strong, unique passwords for database
2. Generate cryptographically secure JWT secrets
3. Rotate API keys regularly
4. Use environment-specific .env files (.env.production, .env.staging)
5. Never expose .env in public repositories
6. Use secrets management tools for production (AWS Secrets Manager, HashiCorp Vault, etc.)
