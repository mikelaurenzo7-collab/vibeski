#!/bin/bash
# =============================================
# Field of Dreams — Neon DB Setup Script
# Run once after creating your Neon project
# =============================================

set -e

echo "Field of Dreams — Database Setup"
echo "=================================="

# Check DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  echo "Get it from: https://neon.tech → Your Project → Connection Details"
  exit 1
fi

echo "Running database migrations..."
npm run db:push

echo ""
echo "✓ Database schema created successfully!"
echo "✓ Tables: users, conversations, messages, projects, project_files,"
echo "         project_data, project_versions, user_memories, conversation_summaries"
echo ""
echo "Next step: Deploy backend to Railway"
echo "  1. railway login"
echo "  2. railway link (select your project)"
echo "  3. railway up"
