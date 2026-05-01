# ☕ Pop-up Push - نظام إدارة شاشات المقاهي المتطور

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/popuppush)
[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)]()
[![RK3588](https://img.shields.io/badge/RK3588-Orange%20Pi%205%20Pro-green.svg)](http://www.orangepi.org/)

**نظام احترافي لإدارة شاشات العرض في المقاهي والمطاعم**

[English](#english) | [العربية](#عربي)

</div>

---

<a name="عربي"></a>
## 🇸🇦 نظرة عامة

**Pop-up Push** هو نظام متكامل لإدارة شاشات العرض الرقمية في المقاهي والمطاعم. مبني على معالج **RK3588 (Orange Pi 5 Pro)** ويدعم نظام **4 طبقات ذكية** للعرض مع تحكم سحابي كامل.

### ✨ المميزات الرئيسية

#### 🎯 نظام 4 طبقات ذكية (4-Layer Smart System)
- **الطبقة 1** - الوسائط: فيديوهات، صوت، YouTube، API Feeds
- **الطبقة 2** - HDMI-IN: بث مباريات كرة القدم مباشرة
- **الطبقة 3** - Pop-up Ads: إعلانات منبثقة (GIF/PNG)
- **الطبقة 4** - Ticker Bar: شريط نصي متمركز

#### ⚽ تكامل رياضي متقدم
- دوري روشن السعودي (Saudi Pro League)
- دوري أبطال أوروبا (UEFA Champions League)
- الدوري الإنجليزي (Premier League)
- الدوري الإسباني (La Liga)
- الدوري الإيطالي (Serie A)

#### 📊 إعلانات هجينة (Hybrid Ads)
- فيديو كامل + صوت
- صوت + صورة خلفية
- إعلانات منبثقة
- نظام أولويات متقدم (1-10)

## 🏗️ هيكل المشروع

```
popuppush-pro/
├── cloud-api/                    # Backend API (Node.js/TypeScript)
│   ├── src/
│   │   ├── services/
│   │   │   ├── LayerManager.ts   # محرك الطبقات الرئيسي
│   │   │   ├── SportsService.ts  # تكامل المباريات
│   │   │   └── DatabaseService.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── types/
│   ├── database/
│   │   └── schema.sql            # هيكل PostgreSQL
│   └── package.json
│
├── player-app/                   # تطبيق Android (Kotlin/Compose)
│   └── (قيد التطوير)
│
├── remote-app/                   # تطبيق التحكم (React Native)
│   └── (قيد التطوير)
│
└── docs/
    └── architecture.md           # توثيق الهندسة المعمارية
```

## 🚀 البدء السريع

### المتطلبات

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Orange Pi 5 Pro (RK3588) - للمشغل

### خطوات التثبيت

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/popuppush-pro.git
cd popuppush-pro

# 2. Setup Cloud API
cd cloud-api
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# 4. Setup database
npm run db:migrate
npm run db:seed

# 5. Start the server
npm run dev
```

## 📡 API Endpoints

### المصادقة
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

### الطبقات (Layers)
```
GET    /api/v1/layers/:deviceId/state
POST   /api/v1/layers/:deviceId/update
POST   /api/v1/layers/:deviceId/activate
POST   /api/v1/layers/:deviceId/deactivate
POST   /api/v1/layers/:deviceId/switch-hdmi
```

### المحتوى
```
POST   /api/v1/content/upload
GET    /api/v1/content
PUT    /api/v1/content/:id
DELETE /api/v1/content/:id
```

### الجدولة
```
POST   /api/v1/schedules
GET    /api/v1/schedules
PUT    /api/v1/schedules/:id
DELETE /api/v1/schedules/:id
```

### الرياضة
```
GET    /api/v1/sports/matches
GET    /api/v1/sports/live
POST   /api/v1/sports/:id/trigger
GET    /api/v1/sports/leagues
```

## 🎮 نظام الطبقات (Layer System)

### الـ Z-Index
```
┌─────────────────────────────────────┐
│ z-index: 400 │ Layer 4 - Ticker     │
├─────────────────────────────────────┤
│ z-index: 300 │ Layer 3 - Pop-up     │
├─────────────────────────────────────┤
│ z-index: 200 │ Layer 2 - HDMI-IN    │
├─────────────────────────────────────┤
│ z-index: 100 │ Layer 1 - Media      │
└─────────────────────────────────────┘
```

### أوامر التحكم

```javascript
// Activate Layer
POST /api/v1/layers/device-123/activate
{
  "layerNumber": 3,
  "contentId": "ad-456"
}

// Switch to HDMI (Sports)
POST /api/v1/layers/device-123/switch-hdmi
{
  "inputSource": "hdmi0",
  "resolution": "1080p"
}

// Trigger Hybrid Ad
POST /api/v1/ads/trigger
{
  "adId": "ad-789",
  "deviceIds": ["device-123"],
  "priority": 8
}
```

## ⚽ تكامل المباريات

### الدوريات المدعومة

| الدوري | المعرف | الدولة |
|--------|--------|--------|
| دوري روشن السعودي | 307 | 🇸🇦 السعودية |
| دوري أبطال أوروبا | 2 | 🇪🇺 أوروبا |
| الدوري الإنجليزي | 39 | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 إنجلترا |
| الدوري الإسباني | 140 | 🇪🇸 إسبانيا |
| الدوري الإيطالي | 135 | 🇮🇹 إيطاليا |

### التفعيل التلقائي للمباريات

```javascript
// Auto-switch configuration
{
  "autoSwitchEnabled": true,
  "switchBeforeMinutes": 5,    // 5 دقائق قبل المباراة
  "switchAfterMinutes": 10,    // 10 دقائق بعد المباراة
  "halftimeAds": ["ad-1", "ad-2"],
  "fulltimeAds": ["ad-3"]
}
```

## 📱 تطبيق الريموت (Remote App)

### المميزات
- واجهة Thumbnails لعرض المحتوى
- تحكم فوري بالأجهزة
- عرض حالة الأجهزة Live
- تشغيل/إيقاف/تخطي
- التحكم بالصوت

## 🗄️ قاعدة البيانات

### الجداول الرئيسية

| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمين والمسؤولين |
| `cafes` | المقاهي والمطاعم |
| `devices` | أجهزة RK3588 |
| `media_content` | المحتوى المتعدد |
| `playlists` | قوائم التشغيل |
| `schedules` | الجداول الزمنية |
| `hybrid_ads` | الإعلانات الهجينة |
| `sports_events` | المباريات والأحداث |
| `smart_counter` | العداد الذكي للتقارير |

## 🔧 الإعدادات المتقدمة

### إعدادات RK3588

```json
{
  "hardware": {
    "cpu": "RK3588",
    "cores": 8,
    "gpu": "Mali-G610 MP4",
    "npu": "6 TOPS",
    "ram": "8GB",
    "storage": "64GB eMMC"
  },
  "video": {
    "decode": "8K@60fps",
    "encode": "4K@60fps",
    "hdmi_out": 2,
    "hdmi_in": 1
  },
  "layers": {
    "composition": "hardware_accelerated",
    "max_layers": 4,
    "opacity_support": true
  }
}
```

## 📊 التقارير والإحصائيات

### العداد الذكي (Smart Counter)
- عدد مرات تشغيل المحتوى
- مدة المشاهدة
- عدد المشاهدين التقديري
- أوقات الذروة
- الإعلانات الأكثر فعالية

## 🛡️ الأمان

- **Authentication**: JWT مع Refresh Tokens
- **Encryption**: TLS 1.3
- **Device Pairing**: Unique device tokens
- **Content Protection**: Signed URLs with expiry

## 📝 Roadmap

### المرحلة 1 - Q1 2025 ✅
- [x] نظام 4 طبقات
- [x] Cloud Dashboard
- [x] API المباريات
- [x] Hybrid Ads

### المرحلة 2 - Q2 2025
- [ ] AI Content Recommendation
- [ ] Face Recognition Analytics
- [ ] Advanced Sports Integration
- [ ] Mobile Remote App v2

### المرحلة 3 - Q3 2025
- [ ] Multi-language Support
- [ ] Blockchain Verification
- [ ] AR/VR Integration

## 📞 الدعم

- Email: support@popuppush.com
- Documentation: https://docs.popuppush.com
- API Reference: https://api.popuppush.com/docs

## 📜 الترخيص

هذا المشروع مرخص بموجب **رخصة تجارية خاصة**. جميع الحقوق محفوظة © 2025 Pop-up Push.

---

<div align="center">

**Made with ☕ in Saudi Arabia**

</div>

---

<a name="english"></a>
## 🇺🇸 English Version

### Overview

**Pop-up Push** is a comprehensive digital signage management system for cafes and restaurants. Built on **RK3588 (Orange Pi 5 Pro)** processor and supports a **4-Layer Smart Display System** with full cloud control.

### Key Features

- **4-Layer Smart System**: Media, HDMI-IN (Sports), Pop-up Ads, Ticker
- **Sports Integration**: Saudi Pro League, Champions League, Premier League
- **Hybrid Ads**: Video+Audio, Audio+Image, Pop-up
- **Real-time Control**: WebSocket-based instant updates
- **Priority System**: Advanced ad priority management (1-10)

### Quick Start

```bash
# Install dependencies
cd cloud-api && npm install

# Setup environment
cp .env.example .env

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### API Documentation

See [API Documentation](docs/api.md) for detailed endpoint information.

### License

**Commercial License** - All Rights Reserved © 2025 Pop-up Push
