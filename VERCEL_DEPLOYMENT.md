# 🚀 نشر Pop-up Push Pro على Vercel + Railway

## 📋 نظرة عامة

لأن Vercel تدعم فقط Frontend (React/Vue/Next.js)، سننشر:
- **Frontend (Dashboard)** → Vercel ✅
- **Backend (API)** → Railway أو Render ✅
- **Database** → Railway PostgreSQL ✅

---

## الخطوة 1: إعداد Backend على Railway

### 1.1 إنشاء حساب Railway
```
1. افتح: https://railway.app
2. سجل الدخول بـ GitHub
3. انقر "New Project"
```

### 1.2 نشر PostgreSQL
```
في Railway Dashboard:
→ New → Database → Add PostgreSQL
→ انتظر حتى يصبح "Ready"
→ انقر على PostgreSQL → Variables
→ انسخ: DATABASE_URL
```

### 1.3 نشر Redis
```
→ New → Database → Add Redis
→ انتظر حتى يصبح "Ready"
→ انسخ: REDIS_URL
```

### 1.4 نشر Backend (Node.js)
```
→ New → GitHub Repo
→ اختر مستودارك (popuppush-pro)
→ Railway سيكتشف Dockerfile تلقائياً
```

**أو استخدم Railway CLI:**
```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# داخل مجلد cloud-api
cd popuppush-pro/cloud-api

# إنشاء مشروع
railway init

# نشر
railway up
```

### 1.5 إعداد متغيرات البيئة (Environment Variables)
في Railway Dashboard → Variables:

```
NODE_ENV=production
PORT=3001

# PostgreSQL (من الخطوة 1.2)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Redis (من الخطوة 1.3)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# CORS - رابط Vercel الخاص بك (سنحصل عليه لاحقاً)
FRONTEND_URL=https://your-project.vercel.app

# Sports API
SPORTS_API_KEY=your_api_football_key
```

### 1.6 الحصول على رابط Backend
```
في Railway Dashboard:
→ اذهب لخدمة الـ API
→ انقر على "Settings"
→ انسخ "Public Domain"
→ سيكون شيئاً مثل: https://popuppush-api.up.railway.app
```

---

## الخطوة 2: تحضير Frontend للنشر على Vercel

### 2.1 إنشاء ملف vercel.json
```bash
cd cafe-cms
```

أنشئ ملف `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 2.2 تحديث ملف .env.production
أنشئ ملف `cafe-cms/.env.production`:
```
VITE_API_URL=https://popuppush-api.up.railway.app/api
VITE_SOCKET_URL=wss://popuppush-api.up.railway.app
```

### 2.3 تحديث vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5173,
    host: true
  }
})
```

### 2.4 تحديث package.json
تأكد من وجود:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2.5 رفع الكود على GitHub
```bash
cd cafe-cms

# إذا لم يكن git مهيأً:
git init
git add .
git commit -m "Ready for Vercel deployment"

# أنشئ repo على GitHub ثم:
git remote add origin https://github.com/YOUR_USERNAME/popuppush-dashboard.git
git push -u origin main
```

---

## الخطوة 3: النشر على Vercel

### 3.1 إنشاء حساب Vercel
```
https://vercel.com
سجل الدخول بـ GitHub
```

### 3.2 استيراد المشروع
```
→ Add New Project
→ Import Git Repository
→ اختر popuppush-dashboard
→ انقر Import
```

### 3.3 إعداد الإعدادات
```
Framework Preset: Vite
Root Directory: ./ (أو cafe-cms لو كان ضمن repo أكبر)
Build Command: npm run build
Output Directory: dist
```

### 3.4 إعداد Environment Variables
في Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://popuppush-api.up.railway.app/api
VITE_SOCKET_URL = wss://popuppush-api.up.railway.app
```

### 3.5 النشر
```
→ انقر Deploy
→ انتظر حتى ينتهي Build (2-3 دقائق)
→ ستحصل على رابط: https://popuppush-dashboard.vercel.app
```

---

## الخطوة 4: ربط Backend مع Frontend

### 4.1 تحديث CORS في Backend
في Railway Dashboard → Variables:
```
FRONTEND_URL=https://popuppush-dashboard.vercel.app
```

أو إذا أردت السماح لعدة نطاقات:
```
FRONTEND_URL=https://popuppush-dashboard.vercel.app,https://www.yourdomain.com
```

### 4.2 إعادة تشغيل Backend
```
في Railway:
→ اذهب لخدمة API
→ انقر Deploy → Redeploy
```

---

## الخطوة 5: اختبار النظام

### 5.1 فتح Dashboard
```
افتح: https://popuppush-dashboard.vercel.app
```

### 5.2 التحقق من الاتصال
```
افتح Console في المتصفح (F12)
→ Network tab
→ تحقق من أن الطلبات تذهب لـ railway.app
```

### 5.3 اختبار WebSocket
```javascript
// في Console:
const socket = io('wss://popuppush-api.up.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

---

## 🔧 حل المشاكل الشائعة

### مشكلة: CORS Error
```
الحل: تأكد من أن FRONTEND_URL في Railway يطابق رابط Vercel بالضبط
```

### مشكلة: WebSocket لا يعمل
```
الحل: استخدم wss:// (secure) بدلاً من ws://
في .env.production:
VITE_SOCKET_URL=wss://popuppush-api.up.railway.app
```

### مشكلة: Database connection error
```
الحل: تأكد من أن DATABASE_URL صحيح في Railway variables
جرب: railway variables --service="Your API Service"
```

### مشكلة: Build fails on Vercel
```
الحل: تأكد من أن package.json يحتوي على:
"build": "vite build"
```

---

## 🌐 استخدام نطاق مخصص (Custom Domain)

### ربط دومين على Vercel
```
Dashboard → Project → Settings → Domains
→ أضف: your-domain.com
→ اتبع تعليمات DNS
```

### ربط دومين على Railway
```
Railway Dashboard → API Service → Settings → Domains
→ Generate Domain أو أضف Custom Domain
```

---

## 📊 التكاليف الشهرية (تقديرية)

| الخدمة | الخطة المجانية | الخطة المدفوعة |
|--------|----------------|----------------|
| **Vercel** | 100GB bandwidth | Pro: $20/شهر |
| **Railway** | $5 credit شهرياً | حسب الاستخدام |
| **المجموع** | ~$0-5/شهر | ~$20-50/شهر |

---

## 🎉 ملخص سريع

```bash
# 1. نشر Backend على Railway
railway login
railway init
railway up

# 2. نشر Frontend على Vercel
# git push → Vercel auto-deploy

# 3. ربطهما
# Railway: FRONTEND_URL = https://your-app.vercel.app
# Vercel: VITE_API_URL = https://your-api.railway.app/api

# 4. اختبار
# افتح: https://your-app.vercel.app
```

---

## 📞 دعم إضافي

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Discord**: https://discord.gg/railway

**النظام جاهز للعمل على السحابة!** ☁️🚀
