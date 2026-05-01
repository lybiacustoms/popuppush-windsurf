import { Pool, PoolClient, QueryResult } from 'pg';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger';
import {
  User,
  Cafe,
  Device,
  MediaContent,
  Playlist,
  Schedule,
  HybridAd,
  SportsEvent,
  SportsLeague,
  SmartCounterEvent,
  CurrentLayersState,
  MatchTrigger
} from '../types';

/**
 * DatabaseService - Centralized database operations
 * Handles PostgreSQL for persistence and Redis for caching
 */
export class DatabaseService {
  private pool: Pool;
  private redis: Redis;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DatabaseService');
    
    // Initialize PostgreSQL pool
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'popuppush',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0
    });

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected PostgreSQL error', err);
    });
  }

  // ============================================================================
  // USERS & AUTHENTICATION
  // ============================================================================

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const query = `
      INSERT INTO users (id, email, password_hash, name, role, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      user.email,
      user.password, // Should be hashed before calling
      user.name,
      user.role,
      user.phone,
      user.isActive
    ];

    const result = await this.pool.query(query, values);
    return this.mapUserFromDB(result.rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] ? this.mapUserFromDB(result.rows[0]) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    // Try Redis cache first
    const cached = await this.redis.get(`user:${id}`);
    if (cached) return JSON.parse(cached);

    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows[0]) {
      const user = this.mapUserFromDB(result.rows[0]);
      await this.redis.setex(`user:${id}`, 3600, JSON.stringify(user)); // 1 hour TTL
      return user;
    }
    return null;
  }

  // ============================================================================
  // CAFES
  // ============================================================================

  async createCafe(cafe: Omit<Cafe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cafe> {
    const query = `
      INSERT INTO cafes (id, owner_id, name, brand_name, location, display_config, business_hours, subscription_plan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      cafe.ownerId,
      cafe.name,
      cafe.brandName,
      JSON.stringify(cafe.location),
      JSON.stringify(cafe.displayConfig),
      JSON.stringify(cafe.businessHours),
      cafe.subscriptionPlan
    ];

    const result = await this.pool.query(query, values);
    return this.mapCafeFromDB(result.rows[0]);
  }

  async getCafeById(id: string): Promise<Cafe | null> {
    const cached = await this.redis.get(`cafe:${id}`);
    if (cached) return JSON.parse(cached);

    const query = 'SELECT * FROM cafes WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows[0]) {
      const cafe = this.mapCafeFromDB(result.rows[0]);
      await this.redis.setex(`cafe:${id}`, 3600, JSON.stringify(cafe));
      return cafe;
    }
    return null;
  }

  async getCafesByOwner(ownerId: string): Promise<Cafe[]> {
    const query = 'SELECT * FROM cafes WHERE owner_id = $1';
    const result = await this.pool.query(query, [ownerId]);
    return result.rows.map(row => this.mapCafeFromDB(row));
  }

  // ============================================================================
  // DEVICES
  // ============================================================================

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    const query = `
      INSERT INTO devices (id, cafe_id, name, device_type, serial_number, mac_address, ip_address, hardware_info, pairing_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const values = [
      uuidv4(),
      device.cafeId,
      device.name,
      device.deviceType,
      device.serialNumber,
      device.macAddress,
      device.ipAddress,
      JSON.stringify(device.hardwareInfo),
      pairingCode
    ];

    const result = await this.pool.query(query, values);
    return this.mapDeviceFromDB(result.rows[0]);
  }

  async getDevice(id: string): Promise<Device | null> {
    const cached = await this.redis.get(`device:${id}`);
    if (cached) return JSON.parse(cached);

    const query = 'SELECT * FROM devices WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows[0]) {
      const device = this.mapDeviceFromDB(result.rows[0]);
      await this.redis.setex(`device:${id}`, 300, JSON.stringify(device)); // 5 min TTL
      return device;
    }
    return null;
  }

  async getCafeDevices(cafeId: string): Promise<Device[]> {
    const query = 'SELECT * FROM devices WHERE cafe_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [cafeId]);
    return result.rows.map(row => this.mapDeviceFromDB(row));
  }

  async updateDeviceStatus(id: string, status: Device['status']): Promise<void> {
    const query = `
      UPDATE devices 
      SET status = $1, last_heartbeat = NOW(), updated_at = NOW()
      WHERE id = $2
    `;
    await this.pool.query(query, [status, id]);
    
    // Invalidate cache
    await this.redis.del(`device:${id}`);
  }

  async updateDeviceLayers(id: string, layers: CurrentLayersState): Promise<void> {
    const query = `
      UPDATE devices 
      SET current_layers = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await this.pool.query(query, [JSON.stringify(layers), id]);
    
    // Update Redis cache
    await this.redis.setex(`device:${id}:layers`, 300, JSON.stringify(layers));
  }

  async updateDevicePairing(id: string, code: string, expiresAt: Date): Promise<void> {
    const query = `
      UPDATE devices 
      SET pairing_code = $1, pairing_expires = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await this.pool.query(query, [code, expiresAt, id]);
  }

  // ============================================================================
  // MEDIA CONTENT
  // ============================================================================

  async createMediaContent(content: Omit<MediaContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaContent> {
    const query = `
      INSERT INTO media_content (id, cafe_id, title, description, content_type, source_url, file_path, file_size, duration, thumbnail_url, compatible_layers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      content.cafeId,
      content.title,
      content.description,
      content.contentType,
      content.sourceUrl,
      content.filePath,
      content.fileSize,
      content.duration,
      content.thumbnailUrl,
      content.compatibleLayers
    ];

    const result = await this.pool.query(query, values);
    return this.mapMediaContentFromDB(result.rows[0]);
  }

  async getMediaContent(id: string): Promise<MediaContent | null> {
    const query = 'SELECT * FROM media_content WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapMediaContentFromDB(result.rows[0]) : null;
  }

  async getCafeMedia(cafeId: string, filters?: { type?: string; status?: string }): Promise<MediaContent[]> {
    let query = 'SELECT * FROM media_content WHERE cafe_id = $1';
    const params: any[] = [cafeId];
    let paramCount = 1;

    if (filters?.type) {
      paramCount++;
      query += ` AND content_type = $${paramCount}`;
      params.push(filters.type);
    }

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapMediaContentFromDB(row));
  }

  // ============================================================================
  // PLAYLISTS
  // ============================================================================

  async createPlaylist(playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    const query = `
      INSERT INTO playlists (id, cafe_id, name, description, items, settings, target_layer)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      playlist.cafeId,
      playlist.name,
      playlist.description,
      JSON.stringify(playlist.items),
      JSON.stringify(playlist.settings),
      playlist.targetLayer
    ];

    const result = await this.pool.query(query, values);
    return this.mapPlaylistFromDB(result.rows[0]);
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    const query = 'SELECT * FROM playlists WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapPlaylistFromDB(result.rows[0]) : null;
  }

  async getDefaultPlaylist(cafeId: string): Promise<Playlist | null> {
    const query = `
      SELECT * FROM playlists 
      WHERE cafe_id = $1 AND is_active = true 
      ORDER BY created_at ASC 
      LIMIT 1
    `;
    const result = await this.pool.query(query, [cafeId]);
    return result.rows[0] ? this.mapPlaylistFromDB(result.rows[0]) : null;
  }

  // ============================================================================
  // HYBRID ADS
  // ============================================================================

  async createHybridAd(ad: Omit<HybridAd, 'id' | 'playCount' | 'impressionCount' | 'createdAt' | 'updatedAt'>): Promise<HybridAd> {
    const query = `
      INSERT INTO hybrid_ads (id, cafe_id, advertiser_id, name, ad_type, visual_content_id, audio_content_id, target_layer, trigger_type, trigger_config, priority, display_duration, max_daily_plays, max_total_plays, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const values = [
      uuidv4(),
      ad.cafeId,
      ad.advertiserId,
      ad.name,
      ad.adType,
      ad.visualContentId,
      ad.audioContentId,
      ad.targetLayer,
      ad.triggerType,
      JSON.stringify(ad.triggerConfig),
      ad.priority,
      ad.displayDuration,
      ad.maxDailyPlays,
      ad.maxTotalPlays,
      ad.startDate,
      ad.endDate
    ];

    const result = await this.pool.query(query, values);
    return this.mapHybridAdFromDB(result.rows[0]);
  }

  async getHybridAd(id: string): Promise<HybridAd | null> {
    const query = 'SELECT * FROM hybrid_ads WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapHybridAdFromDB(result.rows[0]) : null;
  }

  async getActiveAds(cafeId: string): Promise<HybridAd[]> {
    const query = `
      SELECT * FROM hybrid_ads 
      WHERE cafe_id = $1 
      AND is_active = true 
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
      AND (max_total_plays IS NULL OR play_count < max_total_plays)
      ORDER BY priority DESC, created_at ASC
    `;
    const result = await this.pool.query(query, [cafeId]);
    return result.rows.map(row => this.mapHybridAdFromDB(row));
  }

  async incrementAdPlayCount(adId: string): Promise<void> {
    const query = `
      UPDATE hybrid_ads 
      SET play_count = play_count + 1, impression_count = impression_count + 1, updated_at = NOW()
      WHERE id = $1
    `;
    await this.pool.query(query, [adId]);
  }

  // ============================================================================
  // SPORTS EVENTS
  // ============================================================================

  async upsertLeague(league: SportsLeague): Promise<void> {
    const query = `
      INSERT INTO sports_leagues (id, name, country, logo_url, api_provider, api_config, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        logo_url = EXCLUDED.logo_url,
        api_config = EXCLUDED.api_config,
        updated_at = NOW()
    `;
    await this.pool.query(query, [
      league.id,
      league.name,
      league.country,
      league.logoUrl,
      league.apiProvider,
      JSON.stringify(league.apiConfig),
      league.isActive
    ]);
  }

  async upsertSportsEvent(event: SportsEvent): Promise<void> {
    const query = `
      INSERT INTO sports_events (id, league_id, match_name, team_home, team_away, team_home_logo, team_away_logo, match_time, status, auto_switch_enabled, switch_before_minutes, switch_after_minutes, ir_commands)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        match_name = EXCLUDED.match_name,
        team_home = EXCLUDED.team_home,
        team_away = EXCLUDED.team_away,
        match_time = EXCLUDED.match_time,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
    await this.pool.query(query, [
      event.id,
      event.leagueId,
      event.matchName,
      event.teamHome,
      event.teamAway,
      event.teamHomeLogo,
      event.teamAwayLogo,
      event.matchTime,
      event.status,
      event.autoSwitchEnabled,
      event.switchBeforeMinutes,
      event.switchAfterMinutes,
      JSON.stringify(event.irCommands)
    ]);
  }

  async getSportsEvent(id: string): Promise<SportsEvent | null> {
    const query = 'SELECT * FROM sports_events WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapSportsEventFromDB(result.rows[0]) : null;
  }

  async getUpcomingMatches(fromDate: Date): Promise<SportsEvent[]> {
    const query = `
      SELECT * FROM sports_events 
      WHERE match_time >= $1 
      AND status IN ('upcoming', 'live', 'halftime')
      ORDER BY match_time ASC
    `;
    const result = await this.pool.query(query, [fromDate]);
    return result.rows.map(row => this.mapSportsEventFromDB(row));
  }

  async getMatchesByStatus(status: SportsEvent['status']): Promise<SportsEvent[]> {
    const query = 'SELECT * FROM sports_events WHERE status = $1 ORDER BY match_time ASC';
    const result = await this.pool.query(query, [status]);
    return result.rows.map(row => this.mapSportsEventFromDB(row));
  }

  async getCafesWithAutoSwitch(leagueId: string): Promise<Cafe[]> {
    // This would query a junction table or cafe settings
    // Simplified implementation
    const query = `
      SELECT c.* FROM cafes c
      JOIN cafe_sports_config csc ON c.id = csc.cafe_id
      WHERE csc.league_id = $1 AND csc.auto_switch_enabled = true
    `;
    const result = await this.pool.query(query, [leagueId]);
    return result.rows.map(row => this.mapCafeFromDB(row));
  }

  async createMatchTrigger(trigger: Omit<MatchTrigger, 'id' | 'createdAt'>): Promise<void> {
    const query = `
      INSERT INTO match_triggers (id, event_id, cafe_id, device_id, trigger_type, action_type, action_config, executed_at, execution_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await this.pool.query(query, [
      uuidv4(),
      trigger.eventId,
      trigger.cafeId,
      trigger.deviceId,
      trigger.triggerType,
      trigger.actionType,
      JSON.stringify(trigger.actionConfig),
      trigger.executedAt,
      trigger.executionStatus
    ]);
  }

  async updateCafeSportsConfig(cafeId: string, config: any): Promise<void> {
    // Would update or create sports configuration for a cafe
    this.logger.info(`Updated sports config for cafe ${cafeId}`, config);
  }

  // ============================================================================
  // ANALYTICS & SMART COUNTER
  // ============================================================================

  async logSmartCounter(event: Omit<SmartCounterEvent, 'id' | 'timestamp'>): Promise<void> {
    const query = `
      INSERT INTO smart_counter (id, cafe_id, device_id, content_id, ad_id, playlist_id, event_type, metadata, session_id, estimated_viewers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await this.pool.query(query, [
      uuidv4(),
      event.cafeId || null,
      event.deviceId || null,
      event.contentId || null,
      event.adId || null,
      event.playlistId || null,
      event.eventType,
      JSON.stringify(event.metadata),
      event.sessionId || null,
      event.estimatedViewers || null
    ]);
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // MAPPERS (DB Row -> TypeScript Object)
  // ============================================================================

  private mapUserFromDB(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      phone: row.phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
      isActive: row.is_active
    };
  }

  private mapCafeFromDB(row: any): Cafe {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      brandName: row.brand_name,
      location: row.location,
      displayConfig: row.display_config,
      businessHours: row.business_hours,
      subscriptionPlan: row.subscription_plan,
      subscriptionExpires: row.subscription_expires,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDeviceFromDB(row: any): Device {
    return {
      id: row.id,
      cafeId: row.cafe_id,
      name: row.name,
      deviceType: row.device_type,
      serialNumber: row.serial_number,
      macAddress: row.mac_address,
      ipAddress: row.ip_address,
      networkConfig: row.network_config,
      status: row.status,
      lastHeartbeat: row.last_heartbeat,
      currentLayers: row.current_layers || {
        layer1Media: { active: true, zIndex: 100, contentId: null, playlistId: null, volume: 70, isPlaying: false, currentPosition: 0 },
        layer2HdmiIn: { active: false, zIndex: 200, inputSource: null, isCapturing: false },
        layer3Popup: { active: false, zIndex: 300, contentId: null, animation: 'fade', position: 'bottom-right', displayDuration: 10 },
        layer4Ticker: { active: true, zIndex: 400, text: '', scrollSpeed: 50, direction: 'rtl', fontSize: 24, backgroundColor: 'rgba(0,0,0,0.7)', textColor: '#ffffff' }
      },
      hardwareInfo: row.hardware_info,
      pairingCode: row.pairing_code,
      pairingExpires: row.pairing_expires,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapMediaContentFromDB(row: any): MediaContent {
    return {
      id: row.id,
      cafeId: row.cafe_id,
      title: row.title,
      description: row.description,
      contentType: row.content_type,
      sourceUrl: row.source_url,
      filePath: row.file_path,
      fileSize: row.file_size,
      fileHash: row.file_hash,
      duration: row.duration,
      resolution: row.resolution,
      format: row.format,
      thumbnailUrl: row.thumbnail_url,
      compatibleLayers: row.compatible_layers,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapPlaylistFromDB(row: any): Playlist {
    return {
      id: row.id,
      cafeId: row.cafe_id,
      name: row.name,
      description: row.description,
      items: row.items || [],
      settings: row.settings || { shuffle: false, loop: true, defaultDuration: 30 },
      targetLayer: row.target_layer,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapHybridAdFromDB(row: any): HybridAd {
    return {
      id: row.id,
      cafeId: row.cafe_id,
      advertiserId: row.advertiser_id,
      name: row.name,
      adType: row.ad_type,
      visualContentId: row.visual_content_id,
      audioContentId: row.audio_content_id,
      targetLayer: row.target_layer,
      triggerType: row.trigger_type,
      triggerConfig: row.trigger_config || {},
      priority: row.priority,
      displayDuration: row.display_duration,
      maxDailyPlays: row.max_daily_plays,
      maxTotalPlays: row.max_total_plays,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      playCount: row.play_count,
      impressionCount: row.impression_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSportsEventFromDB(row: any): SportsEvent {
    return {
      id: row.id,
      leagueId: row.league_id,
      matchName: row.match_name,
      teamHome: row.team_home,
      teamAway: row.team_away,
      teamHomeLogo: row.team_home_logo,
      teamAwayLogo: row.team_away_logo,
      matchTime: row.match_time,
      matchEndTime: row.match_end_time,
      status: row.status,
      autoSwitchEnabled: row.auto_switch_enabled,
      switchBeforeMinutes: row.switch_before_minutes,
      switchAfterMinutes: row.switch_after_minutes,
      irCommands: row.ir_commands,
      halftimeAds: row.halftime_ads,
      fulltimeAds: row.fulltime_ads
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async close(): Promise<void> {
    await this.pool.end();
    await this.redis.quit();
    this.logger.info('Database connections closed');
  }
}
