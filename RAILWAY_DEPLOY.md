# 🚂 نشر Backend على Railway

## 🎯 خطوات سريعة

### 1. تثبيت Railway CLI
```powershell
npm install -g @railway/cli
```

### 2. تسجيل الدخول
```powershell
railway login
```

### 3. إعداد المشروع
```powershell
cd D:\solution\popuppush\windsurf\CascadeProjects\windsurf-project\popuppush-pro\cloud-api

# إنشاء مشروع جديد
railway init --name popuppush-backend
```

### 4. إضافة قاعدة البيانات
```powershell
# إنشاء PostgreSQL
railway add --database postgres

# إنشاء Redis
railway add --database redis
```

### 5. إعداد متغيرات البيئة
```powershell
# فتح لوحة التحكم
railway open

# أو إضافة variables عبر CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
railway variables set SPORTS_API_KEY=your-api-key
```

**المتغيرات المطلوبة:**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SPORTS_API_KEY=your-football-api-key
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

متغيرات PostgreSQL و Redis تُضاف تلقائياً من الخدمات.

### 6. نشر التطبيق
```powershell
# رفع الكود
railway up

# أو
railway deploy
```

### 7. الحصول على رابط
```powershell
railway domain
```

سيظهر لك شيء مثل:
```
https://popuppush-backend.up.railway.app
```

### 8. التحقق من النشر
```powershell
curl https://popuppush-backend.up.railway.app/api/health
```

---

## 🔧 إعدادات متقدمة

### إعادة النشر بعد التعديلات
```powershell
cd cloud-api
git add .
git commit -m "Update"
railway up
```

### مشاهدة Logs
```powershell
railway logs
```

### فتح Shell في الحاوية
```powershell
railway shell
```

### إضافة Domain مخصص
```powershell
railway domain add your-domain.com
```

### إعداد البريد الإلكتروني (SendGrid)
```powershell
railway variables set SMTP_HOST=smtp.sendgrid.net
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=apikey
railway variables set SMTP_PASS=your-sendgrid-api-key
```

---

## 📊 إدارة قاعدة البيانات

### الاتصال بـ PostgreSQL
```powershell
# استخدام Railway CLI
railway connect postgres

# أو استخدام pgAdmin
Host: containers-us-west-123.railway.app
Port: 5432
Database: railway
Username: postgres
Password: (من Railway Dashboard)
```

### تشغيل Migration
```powershell
# داخل railway shell
railway shell
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
```

---

## 🌐 ربط مع Vercel

بعد الحصول على رابط Railway:

```
1. اذهب لـ Vercel Dashboard
2. اختر مشروع Dashboard
3. Settings → Environment Variables
4. أضف:
   VITE_API_URL = https://popuppush-backend.up.railway.app/api
   VITE_SOCKET_URL = wss://popuppush-backend.up.railway.app
5. Redeploy
```

ثم في Railway:
```powershell
railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 💰 التسعير

| الاستخدام | التكلفة |
|-----------|---------|
| خطة البداية | $5/شهر (credit مجاني) |
| PostgreSQL | مشمول في الـ $5 |
| Redis | مشمول في الـ $5 |
| Bandwidth | 100GB/شهر |

---

## 🆘 استكشاف الأخطاء

### خطأ: "Cannot connect to database"
```powershell
# تحقق من متغيرات البيئة
railway variables

# تأكد من أن PostgreSQL شغال
railway status
```

### خطأ: "CORS error"
```powershell
# تحديث CORS_ORIGIN
railway variables set CORS_ORIGIN=https://your-vercel-app.vercel.app
railway up
```

### خطأ: "Build failed"
```powershell
# فحص Logs
railway logs --tail

# التأكد من أن package.json صحيح
cat package.json
```

---

## 📞 روابط مفيدة

- **Railway Docs**: https://docs.railway.app
- **Dashboard**: https://railway.app/dashboard
- **Discord**: https://discord.gg/railway

**Backend جاهز للعمل على السحابة!** 🚂☁️
