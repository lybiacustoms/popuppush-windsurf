import axios from 'axios';
import { DatabaseService } from './DatabaseService';
import { LayerManager } from './LayerManager';
import { SportsEvent, SportsLeague, HybridAd } from '../types';
import { Logger } from '../utils/Logger';

/**
 * SportsService - Manages sports events integration and automated actions
 * Supports Saudi Pro League, Champions League, Premier League, and more
 */
export class SportsService {
  private db: DatabaseService;
  private layerManager: LayerManager;
  private logger: Logger;
  
  // API Configuration
  private readonly API_FOOTBALL_KEY: string;
  private readonly API_FOOTBALL_URL = 'https://v3.football.api-sports.io';
  
  // League IDs from API-Football
  private readonly LEAGUE_IDS = {
    SAUDI_PRO_LEAGUE: 307,      // دوري روشن السعودي
    CHAMPIONS_LEAGUE: 2,        // دوري أبطال أوروبا
    PREMIER_LEAGUE: 39,         // الدوري الإنجليزي
    LA_LIGA: 140,               // الدوري الإسباني
    SERIE_A: 135,               // الدوري الإيطالي
    BUNDESLIGA: 78,             // الدوري الألماني
    LIGUE_1: 61,                // الدوري الفرنسي
    AFC_CHAMPIONS: 17,          // دوري أبطال آسيا
  };

  constructor(
    db: DatabaseService, 
    layerManager: LayerManager,
    apiKey: string
  ) {
    this.db = db;
    this.layerManager = layerManager;
    this.API_FOOTBALL_KEY = apiKey;
    this.logger = new Logger('SportsService');
  }

  /**
   * Initialize sports monitoring for all cafes
   */
  public async initialize(): Promise<void> {
    this.logger.info('Initializing Sports Service...');
    
    // Load active leagues
    await this.syncLeagues();
    
    // Schedule match checking every 5 minutes
    setInterval(() => this.checkUpcomingMatches(), 5 * 60 * 1000);
    
    // Check immediately on startup
    await this.checkUpcomingMatches();
    
    this.logger.info('Sports Service initialized');
  }

  /**
   * Sync leagues from database and API
   */
  private async syncLeagues(): Promise<void> {
    try {
      // Get leagues from API
      const response = await axios.get(`${this.API_FOOTBALL_URL}/leagues`, {
        headers: {
          'x-rapidapi-key': this.API_FOOTBALL_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        },
        params: {
          current: 'true'
        }
      });

      const leagues = response.data.response || [];
      
      for (const league of leagues) {
        const leagueId = league.league.id;
        
        // Check if we support this league
        const isSupported = Object.values(this.LEAGUE_IDS).includes(leagueId);
        
        if (isSupported) {
          await this.db.upsertLeague({
            id: String(leagueId),
            name: league.league.name,
            country: league.country.name,
            logoUrl: league.league.logo,
            apiProvider: 'api-football',
            apiConfig: {
              leagueId: leagueId,
              season: league.seasons[0]?.year
            },
            isActive: true
          });
        }
      }

      this.logger.info(`Synced ${leagues.length} leagues`);

    } catch (error) {
      this.logger.error('Failed to sync leagues', error);
    }
  }

  /**
   * Fetch upcoming matches for all configured leagues
   */
  public async fetchUpcomingMatches(leagueId?: number): Promise<SportsEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const params: any = {
        date: today,
        timezone: 'Asia/Riyadh'
      };

      if (leagueId) {
        params.league = leagueId;
      } else {
        // Fetch for all supported leagues
        params.league = Object.values(this.LEAGUE_IDS).join('-');
      }

      const response = await axios.get(`${this.API_FOOTBALL_URL}/fixtures`, {
        headers: {
          'x-rapidapi-key': this.API_FOOTBALL_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        },
        params
      });

      const fixtures = response.data.response || [];
      const events: SportsEvent[] = [];

      for (const fixture of fixtures) {
        const event: SportsEvent = {
          id: String(fixture.fixture.id),
          leagueId: String(fixture.league.id),
          matchName: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          teamHome: fixture.teams.home.name,
          teamAway: fixture.teams.away.name,
          teamHomeLogo: fixture.teams.home.logo,
          teamAwayLogo: fixture.teams.away.logo,
          matchTime: new Date(fixture.fixture.date),
          status: this.mapApiStatus(fixture.fixture.status.short),
          autoSwitchEnabled: false,
          switchBeforeMinutes: 5,
          switchAfterMinutes: 10,
          irCommands: {
            switchToHdmi: 'HDMI_1',
            switchBack: 'MEDIA_MODE',
            volumeUp: 'VOL_UP',
            volumeDown: 'VOL_DOWN',
            mute: 'MUTE'
          }
        };

        events.push(event);
        
        // Store in database
        await this.db.upsertSportsEvent(event);
      }

      this.logger.info(`Fetched ${events.length} upcoming matches`);
      return events;

    } catch (error) {
      this.logger.error('Failed to fetch matches', error);
      return [];
    }
  }

  /**
   * Check for upcoming matches and trigger auto-switch
   */
  private async checkUpcomingMatches(): Promise<void> {
    try {
      const now = new Date();
      const events = await this.db.getUpcomingMatches(now);

      for (const event of events) {
        if (!event.autoSwitchEnabled) continue;

        const matchStart = new Date(event.matchTime);
        const timeDiff = matchStart.getTime() - now.getTime();
        const minutesUntilMatch = Math.floor(timeDiff / (1000 * 60));

        // Switch to HDMI before match starts
        if (minutesUntilMatch === event.switchBeforeMinutes) {
          await this.handleMatchStart(event);
        }

        // Switch back after match ends
        if (event.status === 'finished') {
          const endTime = event.matchEndTime || new Date(matchStart.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours
          const timeSinceEnd = now.getTime() - endTime.getTime();
          const minutesSinceEnd = Math.floor(timeSinceEnd / (1000 * 60));

          if (minutesSinceEnd === event.switchAfterMinutes) {
            await this.handleMatchEnd(event);
          }
        }

        // Handle halftime ads
        if (event.status === 'halftime') {
          await this.triggerHalftimeAds(event);
        }
      }

    } catch (error) {
      this.logger.error('Error checking upcoming matches', error);
    }
  }

  /**
   * Handle match start - switch to HDMI input
   */
  private async handleMatchStart(event: SportsEvent): Promise<void> {
    this.logger.info(`Match starting: ${event.matchName}`);

    // Get all cafes with auto-switch enabled for this league
    const cafes = await this.db.getCafesWithAutoSwitch(event.leagueId);

    for (const cafe of cafes) {
      const devices = await this.db.getCafeDevices(cafe.id);

      for (const device of devices) {
        if (device.status === 'online') {
          // Switch to HDMI input
          await this.layerManager.switchToHdmiInput(
            device.id, 
            'hdmi0',
            {
              resolution: '1080p',
              fps: 60,
              codec: 'h264'
            }
          );

          // Show match notification on ticker
          await this.layerManager.updateLayer(device.id, 4, {
            active: true,
            text: `مباشر الآن: ${event.teamHome} vs ${event.teamAway}`,
            scrollSpeed: 60,
            backgroundColor: 'rgba(0, 128, 0, 0.8)'
          });

          // Log the trigger
          await this.db.createMatchTrigger({
            eventId: event.id,
            cafeId: cafe.id,
            deviceId: device.id,
            triggerType: 'auto_switch',
            actionType: 'switch_to_hdmi',
            actionConfig: { layer: 2, input: 'hdmi0' },
            executedAt: new Date(),
            executionStatus: 'executed'
          });

          this.logger.info(`Device ${device.id} switched to HDMI for match ${event.matchName}`);
        }
      }
    }
  }

  /**
   * Handle match end - switch back to media
   */
  private async handleMatchEnd(event: SportsEvent): Promise<void> {
    this.logger.info(`Match ended: ${event.matchName}`);

    const cafes = await this.db.getCafesWithAutoSwitch(event.leagueId);

    for (const cafe of cafes) {
      const devices = await this.db.getCafeDevices(cafe.id);

      for (const device of devices) {
        // Switch back to regular playlist
        const defaultPlaylist = await this.db.getDefaultPlaylist(cafe.id);
        
        if (defaultPlaylist) {
          await this.layerManager.switchFromHdmiToMedia(device.id, defaultPlaylist.id);
        } else {
          await this.layerManager.switchFromHdmiToMedia(device.id);
        }

        // Update ticker
        await this.layerManager.updateLayer(device.id, 4, {
          active: true,
          text: `انتهت المباراة: ${event.teamHome} ${event.status === 'finished' ? '✓' : ''}`,
          scrollSpeed: 50,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        });

        await this.db.createMatchTrigger({
          eventId: event.id,
          cafeId: cafe.id,
          deviceId: device.id,
          triggerType: 'auto_switch',
          actionType: 'switch_back',
          actionConfig: { layer: 1 },
          executedAt: new Date(),
          executionStatus: 'executed'
        });
      }
    }
  }

  /**
   * Trigger halftime ads
   */
  private async triggerHalftimeAds(event: SportsEvent): Promise<void> {
    if (!event.halftimeAds || event.halftimeAds.length === 0) return;

    this.logger.info(`Triggering halftime ads for ${event.matchName}`);

    for (const adId of event.halftimeAds) {
      const ad = await this.db.getHybridAd(adId);
      if (ad && ad.isActive) {
        const cafes = await this.db.getCafesWithAutoSwitch(event.leagueId);
        
        for (const cafe of cafes) {
          const devices = await this.db.getCafeDevices(cafe.id);
          
          for (const device of devices) {
            await this.layerManager.triggerHybridAd(device.id, ad);
          }
        }
      }
    }
  }

  /**
   * Manually trigger a match event
   */
  public async manualTrigger(
    eventId: string, 
    cafeId: string, 
    action: 'switch_to_match' | 'switch_back' | 'show_ad'
  ): Promise<void> {
    const event = await this.db.getSportsEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const devices = await this.db.getCafeDevices(cafeId);

    for (const device of devices) {
      switch (action) {
        case 'switch_to_match':
          await this.layerManager.switchToHdmiInput(device.id, 'hdmi0');
          break;
        case 'switch_back':
          await this.layerManager.switchFromHdmiToMedia(device.id);
          break;
        case 'show_ad':
          // Show special match ad
          break;
      }
    }

    this.logger.info(`Manual trigger ${action} executed for event ${eventId}`);
  }

  /**
   * Configure auto-switch for a cafe
   */
  public async configureAutoSwitch(
    cafeId: string, 
    leagueId: string, 
    enabled: boolean, 
    settings?: any
  ): Promise<void> {
    await this.db.updateCafeSportsConfig(cafeId, {
      leagueId,
      autoSwitchEnabled: enabled,
      settings
    });

    this.logger.info(`Auto-switch ${enabled ? 'enabled' : 'disabled'} for cafe ${cafeId}, league ${leagueId}`);
  }

  /**
   * Get live matches
   */
  public async getLiveMatches(): Promise<SportsEvent[]> {
    return this.db.getMatchesByStatus('live');
  }

  /**
   * Get upcoming matches for a specific league
   */
  public async getLeagueSchedule(leagueId: string): Promise<SportsEvent[]> {
    return this.db.getUpcomingMatches(new Date());
  }

  /**
   * Map API status to internal status
   */
  private mapApiStatus(apiStatus: string): SportsEvent['status'] {
    const statusMap: Record<string, SportsEvent['status']> = {
      'NS': 'upcoming',      // Not Started
      '1H': 'live',          // First Half
      'HT': 'halftime',       // Halftime
      '2H': 'live',          // Second Half
      'ET': 'live',          // Extra Time
      'P': 'live',           // Penalty
      'FT': 'finished',      // Match Finished
      'AET': 'finished',     // After Extra Time
      'PEN': 'finished',     // Penalty Finished
      'SUSP': 'postponed',   // Suspended
      'INT': 'live',         // Interrupted
      'PST': 'postponed'     // Postponed
    };

    return statusMap[apiStatus] || 'upcoming';
  }

  /**
   * Get Saudi Pro League standings
   */
  public async getSaudiLeagueStandings(): Promise<any> {
    try {
      const response = await axios.get(`${this.API_FOOTBALL_URL}/standings`, {
        headers: {
          'x-rapidapi-key': this.API_FOOTBALL_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        },
        params: {
          league: this.LEAGUE_IDS.SAUDI_PRO_LEAGUE,
          season: new Date().getFullYear()
        }
      });

      return response.data.response?.[0]?.league?.standings?.[0] || [];

    } catch (error) {
      this.logger.error('Failed to get Saudi league standings', error);
      return [];
    }
  }

  /**
   * Get Champions League fixtures
   */
  public async getChampionsLeagueFixtures(): Promise<SportsEvent[]> {
    return this.fetchUpcomingMatches(this.LEAGUE_IDS.CHAMPIONS_LEAGUE);
  }
}