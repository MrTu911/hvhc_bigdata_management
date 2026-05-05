
#!/bin/bash

###############################################################################
# HVHC Big Data - Development Setup Script
# Ubuntu Desktop/Laptop 20.04+
###############################################################################

set -e

echo "💻 HVHC Big Data - Development Setup"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as regular user (not root)
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Do not run this script as root${NC}"
   echo "Run as regular user: ./install-dev.sh"
   exit 1
fi

echo -e "${GREEN}✓ Running as regular user${NC}"

# Update system
echo ""
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo ""
echo "🔧 Installing essential development tools..."
sudo apt install -y curl wget git build-essential software-properties-common \
    vim nano htop tree

# Install Node.js 18.x
echo ""
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
echo ""
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
echo ""
echo "🔴 Installing Redis..."
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Install Python3 and venv
echo ""
echo "🐍 Installing Python3 development tools..."
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Install yarn
echo ""
echo "📦 Installing Yarn..."
sudo npm install -g yarn

# Install global npm packages
echo ""
echo "📦 Installing global npm packages..."
sudo npm install -g prisma @prisma/client tsx

# Setup PostgreSQL for development
echo ""
echo "🗄️  Setting up development database..."
sudo -u postgres psql <<EOF
-- Create development database
CREATE DATABASE hvhc_bigdata_dev;

-- Create development user
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata_dev TO dev_user;

-- Make dev_user superuser for development
ALTER USER dev_user WITH SUPERUSER;

\q
EOF

echo -e "${GREEN}✓ Database setup complete${NC}"

# Install VS Code (optional)
echo ""
read -p "$(echo -e ${BLUE}Do you want to install VS Code? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Installing VS Code..."
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
    sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
    sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
    rm -f packages.microsoft.gpg
    sudo apt update
    sudo apt install -y code
    
    echo "Installing VS Code extensions..."
    code --install-extension dbaeumer.vscode-eslint
    code --install-extension esbenp.prettier-vscode
    code --install-extension Prisma.prisma
    code --install-extension bradlc.vscode-tailwindcss
    code --install-extension ms-python.python
fi

# Install Docker (optional, for testing)
echo ""
read -p "$(echo -e ${BLUE}Do you want to install Docker? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create development directory structure
echo ""
echo "📁 Creating development directory structure..."
mkdir -p ~/Projects/hvhc_bigdata
cd ~/Projects/hvhc_bigdata

# Setup git configuration (if not already done)
echo ""
echo "🔧 Git configuration..."
if [ -z "$(git config --global user.name)" ]; then
    read -p "Enter your Git username: " git_username
    git config --global user.name "$git_username"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "Enter your Git email: " git_email
    git config --global user.email "$git_email"
fi

# Create useful aliases
echo ""
echo "⚙️  Creating useful aliases..."
cat >> ~/.bashrc <<EOF

# HVHC Big Data Development Aliases
alias hvhc-dev='cd ~/Projects/hvhc_bigdata/nextjs_space && npm run dev'
alias hvhc-db='npx prisma studio'
alias hvhc-logs='pm2 logs'
alias hvhc-test='npm run test'
alias hvhc-build='npm run build'
EOF

# Create .env.example for development
echo ""
echo "📝 Creating .env.example template..."
cat > ~/Projects/hvhc_bigdata/.env.example <<EOF
# Database
DATABASE_URL="postgresql://dev_user:dev_password_123@localhost:5432/hvhc_bigdata_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Redis
REDIS_URL="redis://localhost:6379"

# ML Engine (Optional)
ML_ENGINE_URL="http://localhost:8000"

# Development
NODE_ENV="development"
EOF

# Print summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Development Environment Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Installed:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - yarn: $(yarn --version)"
echo "  - PostgreSQL: $(psql --version | head -n1)"
echo "  - Redis: $(redis-server --version)"
echo "  - Python: $(python3 --version)"
echo ""
echo "🗄️  Database:"
echo "  - Database: hvhc_bigdata_dev"
echo "  - User: dev_user"
echo "  - Password: dev_password_123"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo ""
echo "📁 Project Directory: ~/Projects/hvhc_bigdata"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo ""
echo "1. Clone or copy the project:"
echo "   cd ~/Projects/hvhc_bigdata"
echo "   git clone <repository-url> ."
echo ""
echo "2. Install dependencies:"
echo "   cd nextjs_space"
echo "   npm install"
echo ""
echo "3. Setup environment:"
echo "   cp ../.env.example .env.local"
echo "   nano .env.local  # Adjust if needed"
echo ""
echo "4. Initialize database:"
echo "   npx prisma generate"
echo "   npx prisma migrate dev"
echo "   npm run seed"
echo ""
echo "5. Start development server:"
echo "   npm run dev"
echo "   # Or use alias: hvhc-dev"
echo ""
echo "6. Access the app:"
echo "   http://localhost:3000"
echo ""
echo "📚 Useful commands:"
echo "   hvhc-dev     # Start dev server"
echo "   hvhc-db      # Open Prisma Studio"
echo "   hvhc-build   # Build for production"
echo ""
echo "🔄 Reload shell to use aliases:"
echo "   source ~/.bashrc"
echo ""
echo "📖 Full documentation: ~/Projects/hvhc_bigdata/HUONG_DAN_TRIEN_KHAI_DAY_DU.md"
echo ""
