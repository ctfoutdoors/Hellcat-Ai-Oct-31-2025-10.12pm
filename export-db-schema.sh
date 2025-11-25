#!/bin/bash
# Database Schema Export Script
# Generated: November 25, 2025

echo "Exporting database schema from drizzle/schema.ts..."
mkdir -p backups/schema-$(date +%Y%m%d)

# Copy schema file
cp drizzle/schema.ts backups/schema-$(date +%Y%m%d)/schema.ts

# List all existing migrations
if [ -d "drizzle" ]; then
  cp -r drizzle backups/schema-$(date +%Y%m%d)/migrations
fi

echo "Schema exported to backups/schema-$(date +%Y%m%d)/"
