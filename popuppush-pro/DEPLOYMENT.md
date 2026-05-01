# 🚀 Pop-up Push Pro - Deployment Guide
## نظام نشر سحابي متكامل

---

## 📋 متطلبات النظام

### الأدنى (Minimum)
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 20.04 LTS / Debian 11 / CentOS 8

### الموصى به (Recommended)
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS
- Network: 100 Mbps

---

## 🛠️ خطوات النشر السريع

### 1. تثبيت Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 2. إعداد المشروع

```bash
# Clone repository (or upload files)
cd /opt
sudo mkdir popuppush-pro
sudo chown $USER:$USER popuppush-pro
cd popuppush-pro

# Copy project files
# (Upload: cloud-api/, nginx/, docker-compose.yml, .env)

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 3. تعديل الإعدادات (.env)

```env
# 🔴 REQUIRED: Change these passwords!
DB_PASSWORD=YourStrongPassword123!
REDIS_PASSWORD=YourRedisPassword123!
JWT_SECRET=YourJWTSecretKey2024-RandomString

# 🔴 REQUIRED: Sports API Key
# Get from: https://www.api-football.com/
SPORTS_API_KEY=your_api_key_here

# 🔴 REQUIRED: Your server IP/Domain
PLAYER_API_BASE_URL=http://YOUR_SERVER_IP:3001
PLAYER_SOCKET_URL=ws://YOUR_SERVER_IP:3001
```

### 4. تشغيل النظام

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 5. التحقق من النظام

```bash
# Health check
curl http://localhost/health

# Check API
curl http://localhost/api/health

# Check database
docker-compose exec postgres pg_isready

# Check Redis
docker-compose exec redis redis-cli ping
```

---

## 🌐 الوصول للخدمات

| الخدمة | الرابط | الوصف |
|--------|--------|-------|
| API | `http://YOUR_SERVER:3001` | Backend API |
| Nginx | `http://YOUR_SERVER` | Reverse Proxy |
| pgAdmin | `http://YOUR_SERVER:5050` | Database UI |

**بيانات الدخول الافتراضية:**
- **Admin**: `admin@alreem-cafe.com` / `admin123`
- **pgAdmin**: `admin@popuppush.com` / `admin123`

---

## 📱 إعداد تطبيقات الموبايل

### Player App (Android)

```kotlin
// في ملف build.gradle.kts (Module: app)
android {
    defaultConfig {
        buildConfigField("String", "API_BASE_URL", "\"http://YOUR_SERVER_IP:3001\"")
        buildConfigField("String", "SOCKET_URL", "\"ws://YOUR_SERVER_IP:3001\"")
    }
}
```

### Remote App (React Native)

```javascript
// في ملف .env
API_URL=http://YOUR_SERVER_IP/api
SOCKET_URL=ws://YOUR_SERVER_IP
```

---

## 🔒 SSL / HTTPS (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

**تحديث Nginx config للـ SSL:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}
```

---

## 📊 المراقبة والصيانة

### عرض Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### النسخ الاحتياطي
```bash
# Backup database
docker-compose exec postgres pg_dump -U popuppush popuppush > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads
```

### الاستعادة
```bash
# Restore database
docker-compose exec -T postgres psql -U popuppush popuppush < backup_20240120.sql
```

### إعادة التشغيل
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api

# Rebuild after code changes
docker-compose up -d --build api
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: لا يمكن الاتصال بالـ API
```bash
# Check if API is running
docker-compose ps api

# Check API logs
docker-compose logs api | tail -50

# Check network
docker network ls
docker network inspect popuppush-network
```

### المشكلة: WebSocket لا يعمل
```bash
# Verify Nginx WebSocket config
docker-compose exec nginx nginx -t

# Check connection
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost" \
  -H "Origin: http://localhost" \
  http://localhost/socket.io/
```

### المشكلة: قاعدة البيانات لا تستجيب
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# View PostgreSQL logs
docker-compose logs postgres

# Reset database (⚠️ سيحذف البيانات!)
docker-compose down -v
docker-compose up -d
```

---

## ☁️ نشر سحابي (Cloud Providers)

### AWS
```bash
# 1. Launch EC2 instance (t3.medium or larger)
# 2. Open ports: 22, 80, 443, 3001, 5050
# 3. Follow deployment steps above
# 4. Configure Elastic IP
```

### DigitalOcean
```bash
# 1. Create Droplet (4GB RAM minimum)
# 2. Enable monitoring
# 3. Follow deployment steps
# 4. Configure Floating IP
```

### Azure
```bash
# 1. Create VM (Standard_B2s or larger)
# 2. Open NSG ports: 80, 443, 3001, 5050
# 3. Follow deployment steps
```

---

## 📈 التوسع (Scaling)

### إضافة المزيد من الأجهزة
```bash
# Edit docker-compose.yml
services:
  api:
    deploy:
      replicas: 3  # Scale API
```

### تحسين الأداء
```bash
# Increase PostgreSQL connections
docker-compose exec postgres psql -U popuppush -c "ALTER SYSTEM SET max_connections = 200;"

# Redis memory optimization
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🔐 الأمان

### 1. تغيير كلمات المرور الافتراضية
```bash
# .env file - Change ALL default passwords!
nano .env
```

### 2. جدار الحماية (Firewall)
```bash
# UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. تحديث تلقائي
```bash
# Enable unattended upgrades
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

---

## 📞 الدعم

### Logs & Diagnostics
```bash
# Generate diagnostic report
docker-compose logs --tail=1000 > diagnostic_$(date +%Y%m%d).log
docker system df >> diagnostic_$(date +%Y%m%d).log
docker-compose ps >> diagnostic_$(date +%Y%m%d).log
```

### المجتمع
- **GitHub Issues**: github.com/popuppush/issues
- **Email**: support@popuppush.com
- **Documentation**: docs.popuppush.com

---

## ✅ قائمة التحقق للنشر

- [ ] تثبيت Docker & Docker Compose
- [ ] نسخ ملفات المشروع
- [ ] إنشاء ملف .env
- [ ] تغيير كلمات المرور الافتراضية
- [ ] إضافة مفتاح Sports API
- [ ] تحديث روابط Player/Remote apps
- [ ] تشغيل `docker-compose up -d`
- [ ] التحقق من صحة النظام
- [ ] إعداد SSL/HTTPS
- [ ] إعداد Firewall
- [ ] اختبار Player App
- [ ] اختبار Remote App
- [ ] إعداد النسخ الاحتياطي التلقائي

---

**🎉 مبروك! نظامك جاهز للإنتاج!**

Made with ☕ and 💚 in Saudi Arabia
