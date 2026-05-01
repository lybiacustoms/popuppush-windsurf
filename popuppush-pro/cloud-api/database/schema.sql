-- ============================================================================
-- Pop-up Push Database Schema
-- PostgreSQL 15+ with JSONB support for advanced layer management
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (admins, cafe managers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'cafe_manager', -- 'super_admin', 'cafe_manager', 'advertiser'
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Cafes/Restaurants table
CREATE TABLE cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    location JSONB DEFAULT '{}', -- {address, city, lat, lng}
    
    -- Display Settings
    display_config JSONB DEFAULT '{
        "resolution": "1080p",
        "orientation": "landscape",
        "brightness": 80,
        "volume": 70
    }',
    
    -- Business Settings
    business_hours JSONB DEFAULT '{
        "open": "06:00",
        "close": "23:00",
        "days": [0,1,2,3,4,5,6]
    }',
    
    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
    subscription_expires TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices (RK3588 Players, Android TVs)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    
    -- Device Info
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'rk3588', -- 'rk3588', 'android_tv', 'android_box'
    serial_number VARCHAR(255) UNIQUE,
    mac_address VARCHAR(17),
    
    -- Network
    ip_address INET,
    network_config JSONB DEFAULT '{}',
    
    -- Status & Heartbeat
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'playing', 'error'
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    
    -- Current State (Real-time layer configuration)
    current_layers JSONB DEFAULT '{
        "layer_1_media": {"active": false, "content_id": null},
        "layer_2_hdmi_in": {"active": false, "input_source": null},
        "layer_3_popup": {"active": false, "content_id": null},
        "layer_4_ticker": {"active": true, "text": "", "speed": 50}
    }',
    
    -- RK3588 Specific
    hardware_info JSONB DEFAULT '{
        "cpu": "RK3588",
        "ram": "8GB",
        "storage": "64GB",
        "hdmi_out": 2,
        "hdmi_in": 1
    }',
    
    -- Pairing Code for easy setup
    pairing_code VARCHAR(6),
    pairing_expires TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTENT & LAYERS
-- ============================================================================

-- Media Content Library
CREATE TABLE media_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    
    -- Content Metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'youtube', 'api_feed'
    
    -- File/URL
    source_url TEXT, -- For external URLs (YouTube, APIs)
    file_path TEXT, -- For uploaded files
    file_size BIGINT,
    file_hash VARCHAR(64), -- SHA-256 for integrity
    
    -- Technical Specs
    duration INTEGER, -- seconds
    resolution VARCHAR(20), -- '1920x1080', '4K'
    format VARCHAR(20), -- 'mp4', 'mp3', 'png', 'gif'
    
    -- Thumbnail for UI
    thumbnail_url TEXT,
    
    -- Layer compatibility
    compatible_layers INTEGER[] DEFAULT '{1,3}', -- Can be used on which layers
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'processing', 'error', 'archived'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Layer Configurations (The 4-Layer System)
CREATE TABLE layer_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    
    layer_number INTEGER NOT NULL CHECK (layer_number BETWEEN 1 AND 4),
    name VARCHAR(100), -- e.g., 'Background Media', 'Sports HDMI', 'Pop-up Ads'
    
    -- Current content
    content_id UUID REFERENCES media_content(id),
    
    -- Layer Settings
    settings JSONB DEFAULT '{}',
    
    -- Layer-specific configs
    layer_1_media JSONB DEFAULT NULL, -- For video/audio layer
    layer_2_hdmi_in JSONB DEFAULT NULL, -- For HDMI input layer
    layer_3_popup JSONB DEFAULT NULL, -- For pop-up ads layer
    layer_4_ticker JSONB DEFAULT NULL, -- For ticker bar layer
    
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(device_id, layer_number)
);

-- ============================================================================
-- PLAYLISTS & SCHEDULING
-- ============================================================================

-- Playlists
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Playlist Items (ordered)
    items JSONB DEFAULT '[]', -- [{content_id, duration, transition, order}]
    
    -- Playback Settings
    settings JSONB DEFAULT '{
        "shuffle": false,
        "loop": true,
        "default_duration": 30
    }',
    
    -- Target Layer (1, 2, 3, or 4)
    target_layer INTEGER DEFAULT 1,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Scheduling System
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Time Rules
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE,
    end_date DATE,
    
    -- Layer-specific configuration for this schedule
    layer_overrides JSONB DEFAULT '{}', -- Override specific layer settings
    
    -- Schedule priority (higher = takes precedence)
    priority INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADVERTISING SYSTEM (HYBRID ADS)
-- ============================================================================

-- Advertisers
CREATE TABLE advertisers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    business_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hybrid Ads (The core advertising system)
CREATE TABLE hybrid_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    advertiser_id UUID REFERENCES advertisers(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    ad_type VARCHAR(50) NOT NULL, -- 'full_video_audio', 'audio_plus_image', 'popup_only', 'ticker_only'
    
    -- Content References
    visual_content_id UUID REFERENCES media_content(id), -- Video/Image for display
    audio_content_id UUID REFERENCES media_content(id), -- Separate audio track
    
    -- Target Layer
    target_layer INTEGER DEFAULT 3, -- Usually layer 3 for pop-ups
    
    -- Trigger Configuration
    trigger_type VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'event_based', 'api_triggered', 'manual'
    trigger_config JSONB DEFAULT '{}',
    
    -- Priority (1-10, higher = interrupt other content)
    priority INTEGER DEFAULT 5,
    
    -- Display Rules
    display_duration INTEGER, -- seconds, null = play full content
    max_daily_plays INTEGER,
    max_total_plays INTEGER,
    
    -- Schedule
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Status & Stats
    is_active BOOLEAN DEFAULT TRUE,
    play_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Campaigns (Group multiple ads)
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Campaign Schedule
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Budget & Pricing
    budget DECIMAL(10,2),
    pricing_model VARCHAR(50), -- 'cpm', 'cpc', 'flat'
    
    -- Linked Ads
    ad_ids UUID[],
    
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SPORTS INTEGRATION
-- ============================================================================

-- Sports Leagues
CREATE TABLE sports_leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    logo_url TEXT,
    api_provider VARCHAR(100), -- 'football-data', 'api-football', etc.
    api_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
);

-- Matches/Events
CREATE TABLE sports_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES sports_leagues(id) ON DELETE CASCADE,
    
    -- Match Info
    match_name VARCHAR(255),
    team_home VARCHAR(100) NOT NULL,
    team_away VARCHAR(100) NOT NULL,
    team_home_logo TEXT,
    team_away_logo TEXT,
    
    -- Timing
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    match_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'live', 'halftime', 'finished', 'postponed'
    
    -- Auto-switch Configuration (IR to IP)
    auto_switch_enabled BOOLEAN DEFAULT FALSE,
    switch_before_minutes INTEGER DEFAULT 5, -- Switch to HDMI-IN 5 min before match
    switch_after_minutes INTEGER DEFAULT 10, -- Switch back 10 min after match
    
    -- IR/HDMI Commands
    ir_commands JSONB DEFAULT '{
        "switch_to_hdmi": "",
        "switch_back": "",
        "volume_up": "",
        "volume_down": ""
    }',
    
    -- Linked Ads (show during match)
    halftime_ads UUID[],
    fulltime_ads UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Triggers (Automated actions)
CREATE TABLE match_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    
    trigger_type VARCHAR(50) NOT NULL, -- 'match_start', 'match_end', 'halftime', 'goal', 'red_card'
    
    -- Action to perform
    action_type VARCHAR(50) NOT NULL, -- 'switch_layer', 'play_ad', 'change_playlist', 'send_notification'
    action_config JSONB NOT NULL,
    
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_status VARCHAR(50), -- 'pending', 'executed', 'failed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

-- Smart Counter (The "عداد الذكي")
CREATE TABLE smart_counter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    content_id UUID REFERENCES media_content(id) ON DELETE SET NULL,
    ad_id UUID REFERENCES hybrid_ads(id) ON DELETE SET NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL, -- 'content_start', 'content_complete', 'content_skip', 'ad_impression', 'ad_click', 'layer_change', 'device_heartbeat'
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255), -- Group events by session
    
    -- Audience estimation (if available)
    estimated_viewers INTEGER
);

-- Device Logs
CREATE TABLE device_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    
    log_type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'command', 'status_change'
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregated Analytics (for fast reporting)
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Playback Stats
    total_play_time INTEGER, -- seconds
    content_plays INTEGER,
    ad_plays INTEGER,
    unique_content_count INTEGER,
    
    -- Device Stats
    device_uptime JSONB, -- {device_id: minutes}
    device_errors INTEGER,
    
    -- Audience Stats (estimated)
    estimated_total_viewers INTEGER,
    peak_viewer_hour INTEGER, -- 0-23
    
    UNIQUE(cafe_id, date)
);

-- ============================================================================
-- REAL-TIME SYSTEM
-- ============================================================================

-- WebSocket Sessions
CREATE TABLE websocket_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    session_token VARCHAR(255) UNIQUE NOT NULL,
    socket_id VARCHAR(255),
    
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    
    ip_address INET,
    user_agent TEXT
);

-- Command Queue (for offline devices)
CREATE TABLE command_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    
    command_type VARCHAR(100) NOT NULL,
    command_payload JSONB NOT NULL,
    
    priority INTEGER DEFAULT 5,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged', 'failed', 'expired'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Cafe indexes
CREATE INDEX idx_cafes_owner ON cafes(owner_id);

-- Device indexes
CREATE INDEX idx_devices_cafe ON devices(cafe_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_pairing ON devices(pairing_code) WHERE pairing_code IS NOT NULL;
CREATE INDEX idx_devices_heartbeat ON devices(last_heartbeat);

-- Content indexes
CREATE INDEX idx_content_cafe ON media_content(cafe_id);
CREATE INDEX idx_content_type ON media_content(content_type);
CREATE INDEX idx_content_status ON media_content(status);

-- Schedule indexes
CREATE INDEX idx_schedules_cafe ON schedules(cafe_id);
CREATE INDEX idx_schedules_device ON schedules(device_id);
CREATE INDEX idx_schedules_active ON schedules(is_active, days_of_week);
CREATE INDEX idx_schedules_time ON schedules(start_time, end_time);

-- Ads indexes
CREATE INDEX idx_ads_cafe ON hybrid_ads(cafe_id);
CREATE INDEX idx_ads_active ON hybrid_ads(is_active, start_date, end_date);
CREATE INDEX idx_ads_priority ON hybrid_ads(priority DESC);

-- Analytics indexes
CREATE INDEX idx_counter_timestamp ON smart_counter(timestamp);
CREATE INDEX idx_counter_cafe ON smart_counter(cafe_id);
CREATE INDEX idx_counter_event ON smart_counter(event_type);
CREATE INDEX idx_counter_session ON smart_counter(session_id);

-- Sports indexes
CREATE INDEX idx_events_time ON sports_events(match_time);
CREATE INDEX idx_events_status ON sports_events(status);
CREATE INDEX idx_events_league ON sports_events(league_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON hybrid_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Active devices view
CREATE VIEW active_devices AS
SELECT d.*, c.name as cafe_name
FROM devices d
JOIN cafes c ON d.cafe_id = c.id
WHERE d.status = 'online'
AND d.last_heartbeat > NOW() - INTERVAL '5 minutes';

-- Current schedules view
CREATE VIEW current_schedules AS
SELECT s.*, p.name as playlist_name, p.items as playlist_items
FROM schedules s
JOIN playlists p ON s.playlist_id = p.id
WHERE s.is_active = TRUE
AND s.days_of_week @> ARRAY[EXTRACT(DOW FROM NOW())::INTEGER]
AND NOW()::TIME BETWEEN s.start_time AND s.end_time
AND (s.start_date IS NULL OR s.start_date <= NOW()::DATE)
AND (s.end_date IS NULL OR s.end_date >= NOW()::DATE);

-- Active ads view
CREATE VIEW active_ads AS
SELECT a.*, c.name as cafe_name, adv.name as advertiser_name
FROM hybrid_ads a
JOIN cafes c ON a.cafe_id = c.id
LEFT JOIN advertisers adv ON a.advertiser_id = adv.id
WHERE a.is_active = TRUE
AND (a.start_date IS NULL OR a.start_date <= NOW())
AND (a.end_date IS NULL OR a.end_date >= NOW())
AND (a.max_total_plays IS NULL OR a.play_count < a.max_total_plays)
ORDER BY a.priority DESC, a.created_at;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default leagues
INSERT INTO sports_leagues (name, country, api_provider, is_active) VALUES
('Saudi Pro League', 'Saudi Arabia', 'api-football', TRUE),
('UEFA Champions League', 'Europe', 'api-football', TRUE),
('Premier League', 'England', 'api-football', TRUE),
('La Liga', 'Spain', 'api-football', TRUE),
('Serie A', 'Italy', 'api-football', TRUE);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
