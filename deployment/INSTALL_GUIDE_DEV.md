
# 📘 Hướng dẫn cài đặt môi trường Development (Ubuntu Laptop)

## 🎯 Mục tiêu
Thiết lập môi trường phát triển hoàn chỉnh trên Ubuntu laptop để:
- Develop features mới
- Debug issues
- Test locally trước khi deploy
- Collaborate với team

---

## 📋 Yêu cầu hệ thống

### Tối thiểu
- Ubuntu 20.04+ (Desktop)
- 8GB RAM
- 4 CPU cores
- 50GB free space
- Internet connection

### Khuyến nghị
- Ubuntu 22.04 LTS
- 16GB RAM
- 8 CPU cores
- 100GB SSD free
- Fast internet

---

## 🚀 Quick Start

### Cách 1: Script Tự Động (Khuyến nghị)

```bash
# Clone repository
cd ~/
git clone <repository-url> hvhc_bigdata
cd hvhc_bigdata

# Chạy script cài đặt
chmod +x deployment/scripts/install-dev.sh
./deployment/scripts/install-dev.sh
```

Script sẽ tự động cài:
- ✅ Node.js 18
- ✅ PostgreSQL
- ✅ Redis
- ✅ Python3
- ✅ Yarn
- ✅ VS Code (optional)
- ✅ Docker (optional)

### Cách 2: Cài Đặt Thủ Công

Xem phần [Cài Đặt Chi Tiết](#detailed-install) bên dưới.

---

## 🔧 Setup Project

### 1. Install Dependencies

```bash
cd ~/hvhc_bigdata/nextjs_space
npm install
```

### 2. Setup Database

```bash
# Create .env.local
cp .env.example .env.local
nano .env.local
```

Nội dung `.env.local`:
```env
# Database
DATABASE_URL="postgresql://dev_user:dev_password_123@localhost:5432/hvhc_bigdata_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Redis
REDIS_URL="redis://localhost:6379"

# ML Engine (optional)
ML_ENGINE_URL="http://localhost:8000"

# Development
NODE_ENV="development"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Migrations

```bash
npx prisma migrate dev
```

### 5. Seed Database

```bash
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Application sẽ chạy tại: `http://localhost:3000`

---

## 🛠️ Development Workflow

### Running Services

#### Terminal 1: Next.js Dev Server
```bash
cd ~/hvhc_bigdata/nextjs_space
npm run dev
```

#### Terminal 2: Prisma Studio (Database GUI)
```bash
cd ~/hvhc_bigdata/nextjs_space
npx prisma studio
```
Mở: `http://localhost:5555`

#### Terminal 3: ML Engine (optional)
```bash
cd ~/hvhc_bigdata/ml_engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API: `http://localhost:8000`

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Database GUI
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma db push      # Push schema changes
npm run seed            # Seed database

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code (if configured)
npm run type-check      # TypeScript check

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

---

## 🔍 Tools & Extensions

### VS Code Extensions (Khuyến nghị)

```bash
# Install via command line
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension MS-vsliveshare.vsliveshare
```

### VS Code Settings

Tạo `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 🐛 Debugging

### VS Code Launch Configuration

Tạo `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

- **React DevTools**: Install Chrome/Firefox extension
- **Network Tab**: Monitor API calls
- **Console**: Check for errors
- **Application**: View localStorage, cookies, etc.

---

## 📚 Common Tasks

### Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run dev

# 4. Check database changes
npx prisma studio

# 5. Create migration (if schema changed)
npx prisma migrate dev --name add_new_feature

# 6. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Fixing a Bug

```bash
# 1. Create bugfix branch
git checkout -b fix/bug-description

# 2. Reproduce bug locally
npm run dev

# 3. Fix and test
# ... edit files ...

# 4. Verify fix
npm run build
npm run start

# 5. Commit and push
git add .
git commit -m "fix: description of bug fix"
git push origin fix/bug-description
```

### Database Changes

```bash
# Modify schema
nano prisma/schema.prisma

# Create migration
npx prisma migrate dev --name migration_name

# View changes in Prisma Studio
npx prisma studio
```

---

## 🔄 Syncing with Production

### Pull Latest Changes

```bash
git pull origin main
npm install
npx prisma generate
npx prisma migrate dev
```

### Reset Database (WARNING: Deletes all data!)

```bash
npx prisma migrate reset
npm run seed
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -U dev_user -d hvhc_bigdata_dev -h localhost
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
npx prisma generate

# If still issues, clear and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## 📦 Working with Git

### Branch Strategy

```
main
├── develop
│   ├── feature/new-feature
│   ├── feature/another-feature
│   └── fix/bug-fix
```

### Commit Message Convention

```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor component
test: add tests
chore: update dependencies
```

### Before Committing

```bash
# Check status
git status

# Run lint
npm run lint

# Run type check
npm run type-check

# Build to ensure no errors
npm run build
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Integration Tests

```bash
# Start test database
# ... setup test db ...

# Run integration tests
npm run test:integration
```

### Manual Testing

```bash
# Start dev server
npm run dev

# Test in browser
# http://localhost:3000

# Check different user roles
# Use seed data accounts
```

---

## 💡 Pro Tips

### Aliases (Add to ~/.bashrc)

```bash
# HVHC Development Aliases
alias hvhc='cd ~/hvhc_bigdata/nextjs_space'
alias hvhc-dev='cd ~/hvhc_bigdata/nextjs_space && npm run dev'
alias hvhc-db='cd ~/hvhc_bigdata/nextjs_space && npx prisma studio'
alias hvhc-build='cd ~/hvhc_bigdata/nextjs_space && npm run build'
alias hvhc-logs='pm2 logs hvhc-bigdata'
```

Reload: `source ~/.bashrc`

### Quick Database Reset

```bash
# Create script: ~/hvhc_reset.sh
#!/bin/bash
cd ~/hvhc_bigdata/nextjs_space
npx prisma migrate reset --force
npm run seed
echo "✅ Database reset complete!"
```

Usage:
```bash
chmod +x ~/hvhc_reset.sh
~/hvhc_reset.sh
```

---

## 📞 Getting Help

- **Documentation**: `~/hvhc_bigdata/`
- **Team Chat**: [Internal chat link]
- **Issue Tracker**: [GitHub/GitLab Issues]
- **Email**: dev-team@hvhc.edu.vn

---

## <a name="detailed-install"></a>📖 Cài Đặt Chi Tiết (Manual)

### 1. Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be 18.x
```

### 2. PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE hvhc_bigdata_dev;
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata_dev TO dev_user;
ALTER USER dev_user WITH SUPERUSER;
\q
```

### 3. Redis

```bash
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. Python3

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

### 5. Yarn

```bash
sudo npm install -g yarn
yarn --version
```

### 6. Git Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@hvhc.edu.vn"
```

---

**Phiên bản:** 6.1  
**Cập nhật:** 15/10/2025  
**Người soạn:** HVHC IT Team
