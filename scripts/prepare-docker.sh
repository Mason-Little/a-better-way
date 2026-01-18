#!/bin/bash

# Copy Prisma Schema to API Service
echo "Copying schema to services/api..."
cp packages/database/prisma/schema.prisma services/api/schema.prisma
