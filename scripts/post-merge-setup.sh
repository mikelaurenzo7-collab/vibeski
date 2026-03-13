#!/bin/bash
set -e

echo "Post-merge setup: Installing dependencies..."
npm install --no-audit 2>&1 | tail -5

if [ -f "drizzle.config.ts" ] && [ -n "$DATABASE_URL" ]; then
  echo "Pushing database schema..."
  npx drizzle-kit push --force 2>&1 | tail -5
fi

echo "Post-merge setup complete!"
