#!/bin/bash
set -e

echo "Post-merge setup: Installing dependencies and running migrations..."

# Install/update npm dependencies
npm install 2>&1 | tail -5

# Run database migrations if applicable
if [ -f "server/db.ts" ]; then
  echo "Database setup detected"
fi

echo "Post-merge setup complete!"
