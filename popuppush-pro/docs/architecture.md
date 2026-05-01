# Pop-up Push - نظام إدارة شاشات المقاهي المتطور

## نظرة عامة على النظام

نظام **Pop-up Push** هو منصة متكاملة لإدارة شاشات العرض في المقاهي، مبنية على معالج **RK3588 (Orange Pi 5 Pro)**. النظام يدعم 4 طبقات ذكية للعرض مع تحكم سحابي كامل.

---

## البنية التقنية (System Architecture)

### 1. المكونات الرئيسية

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD DASHBOARD (Web)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Cafes     │  │  Content    │  │      Analytics          │ │
│  │  Manager    │  │   Studio    │  │    & Reports            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket / REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD API SERVER                             │
│                    (Node.js / PostgreSQL)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    Auth     │  │  Scheduler  │  │    Layer Manager        │ │
│  │   Service   │  │   Engine    │  │    (Core)               │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PLAYER APP (Android - RK3588)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  4-Layer Engine                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│   │
│  │  │ Layer 1 │ │ Layer 2 │ │ Layer 3 │ │     Layer 4     ││   │
│  │  │ Media   │ │ HDMI-IN │ │ Pop-up  │ │   Ticker Bar    ││   │
│  │  │(Video/  │ │(Sports) │ │(Ads)    │ │  (Text/News)    ││   │
│  │  │ Audio)  │ │         │ │         │ │                 ││   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ BLE / WiFi Direct
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REMOTE APP (Tablet)                          │
│              React Native / Thumbnail Interface                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## مسارات البيانات (Data Flow)

### 1. جدولة المحتوى (Content Scheduling)

```
Dashboard → API Server → PostgreSQL → Scheduler Engine → Player App
    │            │            │              │              │
    │            │            │              │              ▼
    │            │            │              │    [Check Schedule]
    │            │            │              │              │
    │            │            │              └─────► Send Playlist
    │            │            │                           │
    │            │            └──────► Store Schedule ◄────┘
    │            │
    └────────────┘
   Create/Update
```

### 2. التحكم الفوري (Real-time Control)

```
Remote App → API Server → WebSocket → Player App
    │            │             │            │
    │            │             │            ▼
    │            │             │    [Execute Command]
    │            │             │            │
    │            │             └────────────┘
    │            │          Emit Event
    │            │
    └────────────┘
   Send Command
```

### 3. نظام الطبقات (Layer System)

```
┌─────────────────────────────────────────┐
│         Z-Index Stack                    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │     Layer 4: Ticker Bar       │   │ z-index: 400
│   │     (Bottom - Always On)      │   │
│   ├─────────────────────────────────┤   │
│   │     Layer 3: Pop-up Ads       │   │ z-index: 300
│   │     (Animated GIF/PNG)        │   │
│   ├─────────────────────────────────┤   │
│   │     Layer 2: HDMI-IN          │   │ z-index: 200
│   │     (Sports/Matches)          │   │
│   ├─────────────────────────────────┤   │
│   │     Layer 1: Media            │   │ z-index: 100
│   │     (Background Video/Audio)  │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## هيكل قاعدة البيانات (Database Schema)

### الجداول الرئيسية

```sql
-- المقاهي
CREATE TABLE cafes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    location JSONB,
    settings JSONB,
    subscription_plan VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- الأجهزة (RK3588 Players)
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    cafe_id UUID REFERENCES cafes(id),
    name VARCHAR(255),
    device_type VARCHAR(50), -- 'rk3588', 'android_tv'
    serial_number VARCHAR(255) UNIQUE,
    ip_address INET,
    status VARCHAR(20), -- 'online', 'offline', 'playing'
    current_layers JSONB, -- Current layer states
    last_ping TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- المحتوى المتعدد الطبقات
CREATE TABLE media_layers (
    id UUID PRIMARY KEY,
    cafe_id UUID REFERENCES cafes(id),
    layer_type INTEGER, -- 1=Media, 2=HDMI-IN, 3=Pop-up, 4=Ticker
    content_type VARCHAR(50), -- 'video', 'audio', 'youtube', 'api', 'hdmi', 'gif', 'png', 'text'
    source_url TEXT,
    file_path TEXT,
    settings JSONB, -- Layer-specific settings
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- نظام الجدولة المتقدم
CREATE TABLE schedules (
    id UUID PRIMARY KEY,
    cafe_id UUID REFERENCES cafes(id),
    device_id UUID REFERENCES devices(id),
    name VARCHAR(255),
    playlist_id UUID REFERENCES playlists(id),
    days_of_week INTEGER[], -- [0,1,2,3,4,5,6] for Sun-Sat
    start_time TIME,
    end_time TIME,
    layer_configs JSONB, -- Per-layer configuration for this schedule
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true
);

-- الإعلانات الهجينة (Hybrid Ads)
CREATE TABLE hybrid_ads (
    id UUID PRIMARY KEY,
    cafe_id UUID REFERENCES cafes(id),
    advertiser_id UUID REFERENCES advertisers(id),
    ad_type VARCHAR(50), -- 'full_video_audio', 'full_audio_image', 'popup_audio'
    visual_content_id UUID REFERENCES media_layers(id),
    audio_content_id UUID REFERENCES media_layers(id),
    trigger_type VARCHAR(50), -- 'scheduled', 'event', 'api'
    trigger_config JSONB,
    priority INTEGER, -- 1-10, 10 is highest
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    play_count INTEGER DEFAULT 0,
    max_plays INTEGER,
    active BOOLEAN DEFAULT true
);

-- العداد الذكي للتقارير
CREATE TABLE smart_counter (
    id UUID PRIMARY KEY,
    cafe_id UUID REFERENCES cafes(id),
    device_id UUID REFERENCES devices(id),
    content_id UUID REFERENCES media_layers(id),
    ad_id UUID REFERENCES hybrid_ads(id),
    event_type VARCHAR(50), -- 'play', 'complete', 'skip', 'impression'
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- المباريات والأحداث
CREATE TABLE sports_events (
    id UUID PRIMARY KEY,
    league VARCHAR(100), -- 'saudi_pro_league', 'champions_league'
    match_name VARCHAR(255),
    team_home VARCHAR(100),
    team_away VARCHAR(100),
    match_time TIMESTAMP,
    status VARCHAR(50), -- 'upcoming', 'live', 'finished'
    ir_command TEXT, -- IR to IP command for auto-switch
    trigger_ads JSONB, -- Ads to show during match
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## نظام الطبقات (Layer System)

### 1. طبقة الوسائط (Layer 1 - Media Layer)
- **الدعم**: MP4, MP3, YouTube URLs, API Feeds
- **الأولوية**: 100 (Base Layer)
- **الوضع**: Loop or Sequential
- **الإعدادات**: Volume, Brightness, Position

### 2. طبقة HDMI-IN (Layer 2 - Sports Layer)
- **الدعم**: HDMI Input من Orange Pi 5 Pro
- **الأولوية**: 200
- **التفعيل**: يدوي أو تلقائي (IR to IP)
- **الاستخدام**: مباريات كرة القدم

### 3. طبقة Pop-up (Layer 3 - Ad Layer)
- **الدعم**: GIF, PNG مع شفافية
- **الأولوية**: 300
- **التحريك**: Fade, Slide, Bounce
- **الموضع**: Corner, Center, Custom

### 4. طبقة Ticker Bar (Layer 4 - Info Layer)
- **الدعم**: نص متمركر، أخبار، RSS Feeds
- **الأولوية**: 400
- **الموضع**: Bottom of screen
- **الإعدادات**: Speed, Color, Font

---

## الإعلانات الهجينة (Hybrid Ads)

### أنواع الإعلانات

1. **Full Video + Audio** (Type A)
   - فيديو يشغل الطبقة 1 بالكامل
   - الصوت من الفيديو
   - الأولوية: 8-10

2. **Full Audio + Background Image** (Type B)
   - صوت منفصل (MP3)
   - صورة ثابتة أو GIF في الخلفية
   - الأولوية: 5-7

3. **Pop-up + Audio** (Type C)
   - إعلان منبثق في الطبقة 3
   - صوت خلفي مستمر
   - الأولوية: 3-4

4. **Ticker Only** (Type D)
   - نص إعلاني في الشريط
   - الأولوية: 1-2

### نظام الأولويات

```javascript
Priority System:
┌─────────────────────────────────────┐
│ Priority 10: Emergency Ads          │
│ Priority 9:  Premium Sports         │
│ Priority 8:  Full Video Ads         │
│ Priority 7:  Audio+Image Ads        │
│ Priority 5:  Regular Ads            │
│ Priority 3:  Pop-up Ads             │
│ Priority 1:  Ticker Ads             │
│ Priority 0:  Default Content        │
└─────────────────────────────────────┘
```

---

## API Endpoints

### Content Management
```
POST   /api/v1/layers              - Create layer
GET    /api/v1/layers              - List all layers
PUT    /api/v1/layers/:id          - Update layer
DELETE /api/v1/layers/:id          - Delete layer
POST   /api/v1/layers/:id/activate - Activate layer
```

### Device Control
```
POST   /api/v1/devices/:id/command    - Send command
GET    /api/v1/devices/:id/status     - Get status
POST   /api/v1/devices/:id/layers     - Update layers
```

### Sports Integration
```
GET    /api/v1/sports/matches         - Get upcoming matches
POST   /api/v1/sports/:id/trigger     - Trigger match mode
GET    /api/v1/sports/leagues         - List leagues
```

### Real-time
```
WebSocket: wss://api.popuppush.com/ws
Events:
  - layer:update
  - device:status
  - ad:trigger
  - match:start
  - match:end
```

---

## تكامل RK3588 (Orange Pi 5 Pro)

### إمكانيات الجهاز
- **CPU**: Quad-core ARM Cortex-A76 + Quad-core Cortex-A55
- **GPU**: Mali-G610 MP4
- **NPU**: 6 TOPS for AI acceleration
- **Video**: 8K@60fps decode, 4K@60fps encode
- **HDMI**: 2x HDMI out, 1x HDMI in

### تكوين الطبقات
```json
{
  "rk3588_config": {
    "layers": {
      "layer_1_media": {
        "decoder": "hardware",
        "format": ["mp4", "mp3", "mkv"],
        "max_resolution": "4K"
      },
      "layer_2_hdmi_in": {
        "source": "/dev/video0",
        "capture_resolution": "1080p60"
      },
      "layer_3_popup": {
        "overlay": "hardware",
        "formats": ["png", "gif", "webp"],
        "max_size": "2MB"
      },
      "layer_4_ticker": {
        "engine": "opengl",
        "scroll_speed": "configurable"
      }
    }
  }
}
```

---

## الأمان والخصوصية

- **Authentication**: JWT with refresh tokens
- **Encryption**: TLS 1.3 for all communications
- **Device Pairing**: Unique device tokens
- **Content Protection**: Signed URLs with expiry

---

## المستقبل (Roadmap)

### المرحلة 1 (Current)
- [x] 4-Layer Engine
- [x] Cloud Dashboard
- [x] Basic Scheduling

### المرحلة 2 (Next)
- [ ] AI-based Content Recommendation
- [ ] Facial Recognition for Analytics
- [ ] Advanced Sports Integration

### المرحلة 3 (Future)
- [ ] Blockchain for Ad Verification
- [ ] Metaverse Integration
- [ ] Holographic Displays

---

*المستند الإصدار 1.0 - يناير 2025*
