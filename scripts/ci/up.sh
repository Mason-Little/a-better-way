#!/bin/bash
set -e

# Find all docker-compose.yml files (excluding node_modules)
find . -name "docker-compose.yml" -not -path "*/node_modules/*" | while read compose_file; do
  dir=$(dirname "$compose_file")
  echo "🚀 Starting services in $dir..."
  (cd "$dir" && docker-compose up -d --build)
done

echo "✅ All services started."
