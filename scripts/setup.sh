#!/bin/bash

# BastionAuth Development Setup Script

set -e

echo "🏰 Setting up BastionAuth development environment..."
echo ""

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ is required. Current version: $(node -v)"
  exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate keys if not exist
if [ ! -f "./keys/private.pem" ]; then
  echo ""
  echo "🔑 Generating security keys..."
  bash scripts/generate-keys.sh
fi

# Copy .env.example if .env doesn't exist
if [ ! -f ".env" ]; then
  echo ""
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your configuration"
fi

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers (PostgreSQL & Redis)..."
docker-compose -f docker/docker-compose.yml up -d

# Wait for databases to be ready
echo ""
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Generate Prisma client
echo ""
echo "🗃️  Generating Prisma client..."
pnpm db:generate

# Run database migrations
echo ""
echo "🔄 Running database migrations..."
pnpm db:migrate

# Seed database (optional)
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  pnpm db:seed
fi

echo ""
echo "✨ BastionAuth development environment is ready!"
echo ""
echo "Available commands:"
echo "  pnpm dev          - Start development servers"
echo "  pnpm build        - Build all packages"
echo "  pnpm test         - Run tests"
echo "  pnpm lint         - Run linting"
echo "  pnpm db:studio    - Open Prisma Studio"
echo "  pnpm docker:logs  - View Docker logs"
echo ""
echo "🚀 Run 'pnpm dev' to start developing!"

