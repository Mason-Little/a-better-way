#!/bin/bash
set -e

# Start backend services
bash scripts/ci/up.sh

# Start frontend
echo "🚀 Starting frontend..."
pnpm --filter @a-better-way/web dev
