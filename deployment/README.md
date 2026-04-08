
# 🚀 HVHC Big Data - Deployment Documentation

Tài liệu hướng dẫn triển khai đầy đủ cho hệ thống HVHC Big Data Management Platform trên các môi trường khác nhau.

## 📚 Tài liệu có sẵn

### 1. Hướng dẫn tổng quan
- **[HUONG_DAN_TRIEN_KHAI_DAY_DU.md](../HUONG_DAN_TRIEN_KHAI_DAY_DU.md)** - Tổng quan về tất cả các phương thức triển khai

### 2. Hướng dẫn chi tiết theo môi trường

- **[INSTALL_GUIDE_UBUNTU_SERVER.md](INSTALL_GUIDE_UBUNTU_SERVER.md)** - Production deployment trên Ubuntu Server
- **[INSTALL_GUIDE_NAS.md](INSTALL_GUIDE_NAS.md)** - Deployment trên Synology/QNAP NAS
- **[INSTALL_GUIDE_DEV.md](INSTALL_GUIDE_DEV.md)** - Development setup trên Ubuntu Laptop

## 🗂️ Cấu trúc thư mục

```
deployment/
├── README.md                          # File này
├── scripts/                           # Automation scripts
│   ├── install-production.sh          # Ubuntu Server installation
│   ├── install-dev.sh                 # Development setup
│   ├── backup.sh                      # Backup script
│   ├── restore.sh                     # Restore script
│   ├── health-check.sh                # System health check
│   └── update.sh                      # Update script
├── configs/                           # Configuration files
│   ├── nginx.production.conf          # Nginx configuration
│   ├── .env.production                # Production environment
│   └── .env.nas                       # NAS environment
├── docker-compose.nas.yml             # Docker compose for NAS
└── Dockerfile.nas                     # Dockerfile for NAS deployment
```

## 🎯 Chọn phương thức triển khai

### Ubuntu Server (Production)
**Phù hợp với:**
- Production deployment
- High traffic
- Enterprise environment
- Cần high availability

**Ưu điểm:**
- Performance cao nhất
- Full control
- Dễ scale
- Professional monitoring

**Xem:** [INSTALL_GUIDE_UBUNTU_SERVER.md](INSTALL_GUIDE_UBUNTU_SERVER.md)

### NAS (Synology/QNAP)
**Phù hợp với:**
- Small to medium deployment
- Limited IT resources
- Easy management
- Integrated backup

**Ưu điểm:**
- Easy to setup
- GUI management
- Built-in backup
- Cost effective

**Xem:** [INSTALL_GUIDE_NAS.md](INSTALL_GUIDE_NAS.md)

### Development (Ubuntu Laptop)
**Phù hợp với:**
- Developers
- Testing
- Feature development
- Local debugging

**Ưu điểm:**
- Quick setup
- Full debugging tools
- No server needed
- Fast iteration

**Xem:** [INSTALL_GUIDE_DEV.md](INSTALL_GUIDE_DEV.md)

## ⚡ Quick Start

### Ubuntu Server
```bash
sudo ./deployment/scripts/install-production.sh
```

### NAS (Docker)
```bash
docker-compose -f deployment/docker-compose.nas.yml up -d
```

### Development
```bash
./deployment/scripts/install-dev.sh
```

## 🔧 Scripts Available

### install-production.sh
Cài đặt tự động cho Ubuntu Server:
- Node.js, PostgreSQL, Redis, Nginx
- PM2 process manager
- Firewall và security hardening
- Automatic backup setup

### install-dev.sh
Thiết lập môi trường development:
- All development tools
- Database setup
- VS Code extensions (optional)
- Docker (optional)

### backup.sh
Backup tự động:
- PostgreSQL database
- Redis data
- Application files
- User uploads
- Configuration files

### restore.sh
Khôi phục từ backup:
- Database restore
- Files restore
- Configuration restore
- Automatic rollback support

### health-check.sh
Kiểm tra sức khỏe hệ thống:
- Service status
- Database connectivity
- Disk space
- Memory usage
- SSL certificate validity
- Backup status

### update.sh
Cập nhật ứng dụng:
- Pull latest code
- Install dependencies
- Run migrations
- Zero-downtime deployment
- Automatic rollback on failure

## 📝 Configuration Files

### .env.production
Production environment variables:
- Database credentials
- NextAuth configuration
- Redis settings
- Email configuration
- Security settings

### .env.nas
NAS-specific environment:
- Docker network settings
- Volume mappings
- Resource limits

### nginx.production.conf
Nginx configuration:
- SSL/TLS setup
- Reverse proxy
- Caching rules
- Security headers
- Rate limiting

## 🔒 Security Checklist

### Before Production Deployment
- [ ] Change all default passwords
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Configure firewall rules
- [ ] Setup SSL certificate
- [ ] Enable fail2ban
- [ ] Configure backup automation
- [ ] Setup monitoring
- [ ] Test backup/restore procedure
- [ ] Review nginx security headers
- [ ] Enable automatic security updates

## 📊 Monitoring

### Built-in Tools
- **PM2 Monitoring**: `pm2 monit`
- **Netdata**: `http://server-ip:19999`
- **Prisma Studio**: `npx prisma studio`
- **Docker Stats**: `docker stats` (NAS)

### Logs Location
- **Application**: `/var/log/hvhc-bigdata/`
- **Nginx**: `/var/log/nginx/`
- **PostgreSQL**: `/var/log/postgresql/`
- **PM2**: `~/.pm2/logs/`

## 🆘 Support

### Documentation
- [Main README](../README.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Testing Guide](../TESTING_GUIDE.md)
- [API Documentation](../API_DOCS.md)

### Contact
- Email: support@hvhc.edu.vn
- Internal Wiki: [link]
- Issue Tracker: [GitHub/GitLab]

## 🔄 Update Strategy

### Development → Staging → Production

1. **Development**
   ```bash
   git checkout -b feature/new-feature
   # Develop and test locally
   git push origin feature/new-feature
   ```

2. **Staging** (Optional)
   ```bash
   # Deploy to staging server for testing
   ./deployment/scripts/update.sh
   ```

3. **Production**
   ```bash
   # Merge to main
   git checkout main
   git merge feature/new-feature
   
   # Deploy to production
   ./deployment/scripts/backup.sh  # Backup first!
   ./deployment/scripts/update.sh
   ./deployment/scripts/health-check.sh
   ```

## 📈 Scaling Considerations

### Vertical Scaling
- Increase RAM
- Add CPU cores
- Upgrade to SSD
- Optimize PostgreSQL settings

### Horizontal Scaling (Future)
- Load balancer (Nginx/HAProxy)
- Multiple application servers
- Database replication
- Redis cluster

## 🎓 Training Materials

### For System Administrators
- [Server Management Guide](../HUONG_DAN_QUAN_TRI_HE_THONG.md)
- [Backup & Recovery](../BAO_CAO_SUA_LOI_VA_DU_LIEU_MAU.md)

### For Developers
- [Development Setup](INSTALL_GUIDE_DEV.md)
- [Code Contributing Guide](../CONTRIBUTING.md)

### For End Users
- [User Guides by Role](../)
  - [Command](../HUONG_DAN_CHI_HUY_HOC_VIEN.md)
  - [Instructor](../HUONG_DAN_GIANG_VIEN.md)
  - [Student](../HUONG_DAN_HOC_VIEN_SINH_VIEN.md)

---

**Version:** 6.1  
**Last Updated:** 15/10/2025  
**Maintainer:** HVHC IT Team
