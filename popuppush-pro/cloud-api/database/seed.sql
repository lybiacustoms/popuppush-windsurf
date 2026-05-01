-- Pop-up Push Pro - Demo Data Seed
-- Complete demo setup for production-ready showcase
-- Run this after schema.sql to populate with sample data

-- ============================================
-- 1. Demo Cafe & Admin User
-- ============================================

-- Insert demo cafe
INSERT INTO cafes (name, subdomain, address, phone, email, settings, is_active, created_at)
VALUES (
    'مقهى الريم ☕',
    'alreem-cafe',
    'شارع العليا، الرياض، المملكة العربية السعودية',
    '+966 50 123 4567',
    'info@alreem-cafe.com',
    '{
        "timezone": "Asia/Riyadh",
        "defaultLanguage": "ar",
        "features": {
            "azanNotifications": true,
            "autoMatchSwitching": true,
            "smartAds": true
        },
        "display": {
            "resolution": "4K",
            "orientation": "landscape"
        }
    }'::jsonb,
    true,
    NOW()
) ON CONFLICT (subdomain) DO NOTHING;

-- Insert admin user
INSERT INTO users (email, password_hash, full_name, phone, role, cafe_id, permissions, is_active, created_at)
SELECT 
    'admin@alreem-cafe.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G', -- password: admin123
    'مدير المقهى',
    '+966 50 123 4567',
    'cafe_admin',
    id,
    '["*"]'::jsonb,
    true,
    NOW()
FROM cafes WHERE subdomain = 'alreem-cafe'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Demo Player Devices (RK3588)
-- ============================================

INSERT INTO devices (
    cafe_id, name, device_code, serial_number, hardware_type, 
    location, status, ip_address, last_seen, created_at
)
SELECT 
    id,
    'الشاشة الرئيسية',
    'PP-DEMO-001',
    'RK3588-2024-DEMO',
    'rk3588',
    'الصالة الرئيسية',
    'online',
    '192.168.1.100',
    NOW(),
    NOW()
FROM cafes WHERE subdomain = 'alreem-cafe'
ON CONFLICT (device_code) DO NOTHING;

INSERT INTO devices (
    cafe_id, name, device_code, serial_number, hardware_type, 
    location, status, ip_address, last_seen, created_at
)
SELECT 
    id,
    'شاشة VIP',
    'PP-DEMO-002',
    'RK3588-2024-VIP',
    'rk3588',
    'قسم العائلات',
    'online',
    '192.168.1.101',
    NOW(),
    NOW()
FROM cafes WHERE subdomain = 'alreem-cafe'
ON CONFLICT (device_code) DO NOTHING;

-- ============================================
-- 3. Demo Media Content
-- ============================================

INSERT INTO media_content (
    cafe_id, title, type, file_url, thumbnail_url, 
    duration, file_size, mime_type, metadata, status
)
SELECT 
    id,
    'قائمة المشروبات - الصباح',
    'video',
    '/uploads/demo/menu-morning.mp4',
    '/uploads/thumbs/menu-morning.jpg',
    45,
    15728640,
    'video/mp4',
    '{
        "resolution": "1920x1080",
        "codec": "h264",
        "category": "menu"
    }'::jsonb,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

INSERT INTO media_content (
    cafe_id, title, type, file_url, thumbnail_url, 
    duration, file_size, mime_type, metadata, status
)
SELECT 
    id,
    'موسيقى فيروز - صباحية',
    'youtube',
    'https://www.youtube.com/watch?v=fairooz-morning',
    '/uploads/thumbs/fairooz.jpg',
    1800,
    0,
    'video/youtube',
    '{
        "category": "music",
        "artist": "فيروز",
        "playlist": "morning"
    }'::jsonb,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

INSERT INTO media_content (
    cafe_id, title, type, file_url, thumbnail_url, 
    duration, file_size, mime_type, metadata, status
)
SELECT 
    id,
    'إعلان العروض الخاصة',
    'video',
    '/uploads/demo/promo-ads.mp4',
    '/uploads/thumbs/promo.jpg',
    30,
    10485760,
    'video/mp4',
    '{
        "resolution": "1080x1920",
        "category": "advertisement"
    }'::jsonb,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

INSERT INTO media_content (
    cafe_id, title, type, file_url, thumbnail_url, 
    duration, file_size, mime_type, metadata, status
)
SELECT 
    id,
    'مباراة الدوري - إعلانات الشوط',
    'gif',
    '/uploads/demo/match-popup.gif',
    '/uploads/demo/match-popup.gif',
    15,
    2097152,
    'image/gif',
    '{
        "category": "popup",
        "animation": "slideIn",
        "position": "bottom-right"
    }'::jsonb,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

-- ============================================
-- 4. Demo Playlists
-- ============================================

-- Morning Playlist (Fayrouz & Menu)
INSERT INTO playlists (cafe_id, name, description, items, is_default, status)
SELECT 
    id,
    'قائمة الصباح ☀️',
    'موسيقى هادئة مع قائمة المشروبات',
    '[
        {"content_id": "1", "duration": 45, "order": 1},
        {"content_id": "2", "duration": 1800, "order": 2}
    ]'::jsonb,
    true,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

-- Afternoon Playlist (Ads & Music)
INSERT INTO playlists (cafe_id, name, description, items, is_default, status)
SELECT 
    id,
    'قائمة العصر 🌤️',
    'إعلانات العروض مع موسيقى خلفية',
    '[
        {"content_id": "3", "duration": 30, "order": 1},
        {"content_id": "2", "duration": 1800, "order": 2}
    ]'::jsonb,
    false,
    'active'
FROM cafes WHERE subdomain = 'alreem-cafe';

-- ============================================
-- 5. Demo Layer Configurations
-- ============================================

INSERT INTO layers (
    device_id, layer_number, layer_type, name, 
    is_active, config, z_index
)
SELECT 
    d.id,
    1,
    'media',
    'Layer 1 - Media Playback',
    true,
    '{
        "currentPlaylistId": "1",
        "volume": 0.7,
        "playbackMode": "loop",
        "supportedFormats": ["mp4", "mp3", "youtube"]
    }'::jsonb,
    10
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

INSERT INTO layers (
    device_id, layer_number, layer_type, name, 
    is_active, config, z_index
)
SELECT 
    d.id,
    2,
    'hdmi_in',
    'Layer 2 - HDMI Input',
    false,
    '{
        "inputSource": "HDMI1",
        "autoSwitchOnMatch": true,
        "volume": 1.0,
        "rk3588Capture": {
            "width": 1920,
            "height": 1080,
            "fps": 60
        }
    }'::jsonb,
    20
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

INSERT INTO layers (
    device_id, layer_number, layer_type, name, 
    is_active, config, z_index
)
SELECT 
    d.id,
    3,
    'popup_ads',
    'Layer 3 - Pop-up Ads',
    false,
    '{
        "adPool": ["1", "2", "3"],
        "interval": 300,
        "duration": 15,
        "position": "bottom-right",
        "animation": "slideIn",
        "opacity": 0.95,
        "scale": 1.0
    }'::jsonb,
    30
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

INSERT INTO layers (
    device_id, layer_number, layer_type, name, 
    is_active, config, z_index
)
SELECT 
    d.id,
    4,
    'ticker_bar',
    'Layer 4 - Ticker Bar',
    true,
    '{
        "text": "مرحباً بكم في مقهى الريم ☕ | عرض خاص: كابتشينو + كيكة = 25 ريال",
        "scrollSpeed": 50,
        "direction": "rtl",
        "fontSize": 24,
        "textColor": "#FFFFFF",
        "backgroundColor": "rgba(0,0,0,0.8)"
    }'::jsonb,
    40
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- ============================================
-- 6. Demo Schedules (Azan & Matches)
-- ============================================

-- Fajr Azan
INSERT INTO schedules (
    cafe_id, device_id, name, type, 
    cron_expression, time_zone, action_data, is_active
)
SELECT 
    c.id,
    d.id,
    'أذان الفجر',
    'azan',
    '0 4 * * *',
    'Asia/Riyadh',
    '{
        "type": "mute",
        "duration": 600,
        "volume": 0,
        "azanSource": "fajr"
    }'::jsonb,
    true
FROM cafes c
JOIN devices d ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- Asr Azan
INSERT INTO schedules (
    cafe_id, device_id, name, type, 
    cron_expression, time_zone, action_data, is_active
)
SELECT 
    c.id,
    d.id,
    'أذان العصر',
    'azan',
    '0 15 * * *',
    'Asia/Riyadh',
    '{
        "type": "mute",
        "duration": 600,
        "volume": 0.1
    }'::jsonb,
    true
FROM cafes c
JOIN devices d ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- Maghrib Azan
INSERT INTO schedules (
    cafe_id, device_id, name, type, 
    cron_expression, time_zone, action_data, is_active
)
SELECT 
    c.id,
    d.id,
    'أذان المغرب',
    'azan',
    '0 18 * * *',
    'Asia/Riyadh',
    '{
        "type": "mute",
        "duration": 600,
        "volume": 0.1
    }'::jsonb,
    true
FROM cafes c
JOIN devices d ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- Sample Match Schedule (Hypothetical Saudi League Match)
INSERT INTO schedules (
    cafe_id, device_id, name, type, 
    start_time, end_time, action_data, is_active
)
SELECT 
    c.id,
    d.id,
    'مباراة الهلال vs النصر',
    'match',
    '2024-05-20 20:00:00+03',
    '2024-05-20 22:00:00+03',
    '{
        "league": "Saudi Pro League",
        "homeTeam": "الهلال",
        "awayTeam": "النصر",
        "channel": "SSC1",
        "autoSwitchToHdmi": true,
        "enableAdsDuringHalftime": true,
        "triggerHalftimeAd": true
    }'::jsonb,
    true
FROM cafes c
JOIN devices d ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- ============================================
-- 7. Demo Advertisers & Hybrid Ads
-- ============================================

-- Demo Advertiser
INSERT INTO advertisers (cafe_id, company_name, contact_email, contact_phone, contract_type, is_active)
SELECT 
    id,
    'شركة القهوة العربية',
    'ads@arabian-coffee.com',
    '+966 55 987 6543',
    'hybrid',
    true
FROM cafes WHERE subdomain = 'alreem-cafe';

-- Demo Hybrid Ad
INSERT INTO hybrid_ads (
    cafe_id, advertiser_id, name, ad_type, content, 
    priority, trigger_conditions, schedule_config, is_active
)
SELECT 
    c.id,
    a.id,
    'عرض القهوة المميز',
    'popup',
    '{
        "imageUrl": "/uploads/ads/coffee-offer.png",
        "duration": 15,
        "position": "bottom-right",
        "animation": "slideIn"
    }'::jsonb,
    8,
    '{
        "type": "time_based",
        "rules": [
            {"condition": "time_range", "start": "14:00", "end": "17:00"},
            {"condition": "match_status", "status": "not_live"}
        ]
    }'::jsonb,
    '{
        "startDate": "2024-05-01",
        "endDate": "2024-06-30",
        "dailyImpressionLimit": 20,
        "hourlyImpressionLimit": 5
    }'::jsonb,
    true
FROM cafes c
JOIN advertisers a ON a.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe';

-- ============================================
-- 8. Demo Smart Counter Events
-- ============================================

INSERT INTO smart_counter_events (
    device_id, event_type, trigger_source, content_displayed, 
    metadata, counted
)
SELECT 
    d.id,
    'impression',
    'layer_3_popup',
    'عرض القهوة المميز',
    '{
        "adId": "1",
        "duration": 15,
        "location": "bottom-right"
    }'::jsonb,
    true
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- ============================================
-- 9. Demo Analytics
-- ============================================

INSERT INTO analytics (
    device_id, date, total_playtime, layer_stats, 
    ad_impressions, ad_triggers, unique_content
)
SELECT 
    d.id,
    CURRENT_DATE,
    28800,
    '{
        "layer1": {"playtime": 14400, "switches": 5},
        "layer2": {"playtime": 7200, "switches": 2},
        "layer3": {"impressions": 48},
        "layer4": {"scrollDistance": 15000}
    }'::jsonb,
    48,
    12,
    8
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' AND d.device_code = 'PP-DEMO-001';

-- ============================================
-- 10. Demo Remote Control Logs
-- ============================================

INSERT INTO remote_logs (
    device_id, user_id, action, details, ip_address, success
)
SELECT 
    d.id,
    u.id,
    'layer_toggle',
    '{
        "layerNumber": 3,
        "action": "activate",
        "source": "remote_app"
    }'::jsonb,
    '192.168.1.50',
    true
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
JOIN users u ON u.cafe_id = c.id
WHERE c.subdomain = 'alreem-cafe' 
AND d.device_code = 'PP-DEMO-001'
AND u.email = 'admin@alreem-cafe.com';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pop-up Push Pro - Demo Data Seeded!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Cafe: مقهى الريم ☕';
    RAISE NOTICE 'Admin: admin@alreem-cafe.com / admin123';
    RAISE NOTICE 'Devices: 2 RK3588 Players configured';
    RAISE NOTICE 'Content: 4 media items + 2 playlists';
    RAISE NOTICE 'Schedules: 3 Azan + 1 Match';
    RAISE NOTICE 'Layers: 4-layer system ready';
    RAISE NOTICE '========================================';
END $$;
