#!/bin/bash
# ============================================
# HVHC BigData - Local Development Setup
# For Ubuntu Desktop/Laptop
# ============================================

set -e

echo "==========================================="
echo "HVHC BigData - Local Development Setup"
echo "==========================================="

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
  echo "⚠️  This script is designed for Ubuntu. Some commands may not work."
fi

# 1. Install Node.js
echo ""
echo "[1/7] Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  echo "✅ Node.js installed: $(node -v)"
else
  echo "✅ Node.js already installed: $(node -v)"
fi

# 2. Install Yarn
echo ""
echo "[2/7] Installing Yarn..."
if ! command -v yarn &> /dev/null; then
  sudo npm install -g yarn
  echo "✅ Yarn installed: $(yarn -v)"
else
  echo "✅ Yarn already installed: $(yarn -v)"
fi

# 3. Install PostgreSQL
echo ""
echo "[3/7] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  echo "✅ PostgreSQL installed"
else
  echo "✅ PostgreSQL already installed"
fi

# 4. Create database user and database
echo ""
echo "[4/7] Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'hvhc_dev'" | grep -q 1 || {
  sudo -u postgres psql -c "CREATE USER hvhc_dev WITH PASSWORD 'hvhc_dev_2025';"
  echo "✅ Database user created: hvhc_dev"
}

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'hvhc_bigdata_dev'" | grep -q 1 || {
  sudo -u postgres psql -c "CREATE DATABASE hvhc_bigdata_dev OWNER hvhc_dev;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata_dev TO hvhc_dev;"
  echo "✅ Database created: hvhc_bigdata_dev"
}

echo "✅ Database setup complete"

# 5. Navigate to project directory
echo ""
echo "[5/7] Setting up project..."
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR/nextjs_space"

# 6. Create .env file if not exists
echo ""
echo "[6/7] Creating environment file..."
if [ ! -f .env.local ]; then
  SECRET=$(openssl rand -base64 32)
  cat > .env.local << EOF
# Database - Local PostgreSQL
DATABASE_URL='postgresql://hvhc_dev:hvhc_dev_2025@localhost:5432/hvhc_bigdata_dev'

# NextAuth
NEXTAUTH_SECRET='$SECRET'
NEXTAUTH_URL='http://localhost:3000'

# Optional - Abacus AI
ABACUSAI_API_KEY=''

# Optional - AWS S3
AWS_BUCKET_NAME=''
AWS_FOLDER_PREFIX=''

# Optional - Redis
REDIS_URL=''

# Optional - SMTP
SMTP_HOST=''
SMTP_PORT=''
SMTP_USER=''
SMTP_PASS=''
EOF
  echo "✅ Created .env.local"
else
  echo "✅ .env.local already exists"
fi

# 7. Install dependencies
echo ""
echo "[7/7] Installing dependencies..."
yarn install

# Generate Prisma client
echo "Generating Prisma client..."
yarn prisma generate

echo ""
echo "==========================================="
echo "SETUP COMPLETE!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_DIR/nextjs_space"
echo "2. If you have a backup, restore it:"
echo "   psql -h localhost -U hvhc_dev -d hvhc_bigdata_dev < backup.sql"
echo "3. Or push schema from Prisma:"
echo "   yarn prisma db push"
echo "4. Seed data (if available):"
echo "   yarn prisma db seed"
echo "5. Start development server:"
echo "   yarn dev"
echo ""
echo "Login credentials:"
echo "  Admin: john@doe.com / johndoe123"
echo ""
