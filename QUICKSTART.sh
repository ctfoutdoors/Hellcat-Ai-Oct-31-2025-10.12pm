#!/bin/bash
# Carrier Dispute System - Quick Start Script
# Run this after extracting the backup to get up and running quickly

set -e

echo "🚀 Carrier Dispute System - Quick Start"
echo "========================================"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js 22+ required. Current: $(node -v)"
    echo "   Please install Node.js 22 or higher"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
echo ""
echo "📋 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo "   This may take a few minutes..."
pnpm install --silent
echo "✅ Dependencies installed"

# Check environment variables
echo ""
echo "📋 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
    echo "   Set it with: export DATABASE_URL='mysql://user:pass@host:port/database'"
else
    echo "✅ DATABASE_URL configured"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  JWT_SECRET not set (using default for dev)"
    export JWT_SECRET="dev-secret-change-in-production"
fi

# Initialize database
echo ""
echo "🗄️  Initializing database..."
pnpm db:push
echo "✅ Database schema created (28 tables)"

# Seed CRM data (optional)
echo ""
read -p "📊 Seed CRM sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/seed-crm.mjs
    echo "✅ Sample data seeded (3 companies, 5 contacts, 5 deals)"
fi

# All done
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  pnpm dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📚 For more information, see BACKUP-RESTORE-GUIDE.md"
