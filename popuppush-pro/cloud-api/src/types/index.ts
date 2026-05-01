// ============================================================================
// Core Types for Pop-up Push System
// ============================================================================

// User & Authentication
export interface User {
  id: string;
  email: string;
  password?: string; // For creation only, not stored in type usually
  name: string;
  role: 'super_admin' | 'cafe_manager' | 'advertiser';
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Cafe & Location
export interface Location {
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  country?: string;
}

export interface BusinessHours {
  open: string; // HH:MM format
  close: string;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface Cafe {
  id: string;
  ownerId: string;
  name: string;
  brandName?: string;
  location: Location;
  displayConfig: DisplayConfig;
  businessHours: BusinessHours;
  subscriptionPlan: 'basic' | 'pro' | 'enterprise';
  subscriptionExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisplayConfig {
  resolution: '720p' | '1080p' | '4K';
  orientation: 'landscape' | 'portrait';
  brightness: number; // 0-100
  volume: number; // 0-100
}

// Device (RK3588 Player)
export interface Device {
  id: string;
  cafeId: string;
  name: string;
  deviceType: 'rk3588' | 'android_tv' | 'android_box';
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  networkConfig?: Record<string, any>;
  status: 'online' | 'offline' | 'playing' | 'error';
  lastHeartbeat?: Date;
  currentLayers: CurrentLayersState;
  hardwareInfo: HardwareInfo;
  pairingCode?: string;
  pairingExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HardwareInfo {
  cpu: string;
  ram: string;
  storage: string;
  hdmiOut: number;
  hdmiIn: number;
}

// Layer System - The Core 4-Layer Architecture
export interface CurrentLayersState {
  layer1Media: Layer1State;
  layer2HdmiIn: Layer2State;
  layer3Popup: Layer3State;
  layer4Ticker: Layer4State;
}

export interface LayerState {
  active: boolean;
  zIndex: number;
}

export interface Layer1State extends LayerState {
  contentId: string | null;
  playlistId: string | null;
  volume: number;
  isPlaying: boolean;
  currentPosition: number;
}

export interface Layer2State extends LayerState {
  inputSource: string | null; // HDMI input source
  isCapturing: boolean;
  captureSettings?: HdmiCaptureSettings;
}

export interface HdmiCaptureSettings {
  resolution: string;
  fps: number;
  codec: string;
}

export interface Layer3State extends LayerState {
  contentId: string | null;
  animation: 'fade' | 'slide' | 'bounce' | 'none';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  displayDuration: number; // seconds
}

export interface Layer4State extends LayerState {
  text: string;
  scrollSpeed: number; // 0-100
  direction: 'rtl' | 'ltr';
  fontSize: number;
  backgroundColor: string;
  textColor: string;
}

// Media Content
export interface MediaContent {
  id: string;
  cafeId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'audio' | 'image' | 'youtube' | 'api_feed' | 'gif' | 'png';
  sourceUrl?: string;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  duration?: number; // seconds
  resolution?: string;
  format?: string;
  thumbnailUrl?: string;
  compatibleLayers: number[]; // [1, 2, 3, 4]
  status: 'active' | 'processing' | 'error' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Playlist
export interface PlaylistItem {
  id: string;
  contentId: string;
  order: number;
  duration: number | null; // null = play full
  transition: 'fade' | 'slide' | 'none';
  repeat: number;
}

export interface Playlist {
  id: string;
  cafeId: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  settings: PlaylistSettings;
  targetLayer: 1 | 2 | 3 | 4;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistSettings {
  shuffle: boolean;
  loop: boolean;
  defaultDuration: number;
}

// Scheduling
export interface Schedule {
  id: string;
  cafeId: string;
  deviceId: string;
  playlistId: string;
  name: string;
  daysOfWeek: number[]; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  startDate?: Date;
  endDate?: Date;
  layerOverrides?: Record<string, any>;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Hybrid Ads System
export type AdType = 
  | 'full_video_audio'      // Full video with its audio
  | 'audio_plus_image'      // Audio track + background image
  | 'popup_only'            // Pop-up visual only
  | 'ticker_only'           // Ticker text only
  | 'popup_audio';          // Pop-up + background audio

export interface HybridAd {
  id: string;
  cafeId: string;
  advertiserId?: string;
  name: string;
  adType: AdType;
  visualContentId?: string;
  audioContentId?: string;
  targetLayer: 1 | 2 | 3 | 4;
  triggerType: 'scheduled' | 'event_based' | 'api_triggered' | 'manual';
  triggerConfig: TriggerConfig;
  priority: number; // 1-10
  displayDuration?: number; // seconds
  maxDailyPlays?: number;
  maxTotalPlays?: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  playCount: number;
  impressionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerConfig {
  scheduledTimes?: string[]; // HH:MM
  eventTriggers?: string[]; // 'match_start', 'halftime', etc.
  apiEndpoint?: string;
  conditions?: Record<string, any>;
}

// Sports Integration
export interface SportsLeague {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  apiProvider: string;
  apiConfig: Record<string, any>;
  isActive: boolean;
}

export interface SportsEvent {
  id: string;
  leagueId: string;
  matchName?: string;
  teamHome: string;
  teamAway: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
  matchTime: Date;
  matchEndTime?: Date;
  status: 'upcoming' | 'live' | 'halftime' | 'finished' | 'postponed';
  autoSwitchEnabled: boolean;
  switchBeforeMinutes: number;
  switchAfterMinutes: number;
  irCommands?: IrCommands;
  halftimeAds?: string[];
  fulltimeAds?: string[];
}

export interface IrCommands {
  switchToHdmi: string;
  switchBack: string;
  volumeUp: string;
  volumeDown: string;
  mute: string;
}

// Match Trigger for automated sports switching
export interface MatchTrigger {
  id: string;
  eventId: string;
  cafeId: string;
  deviceId: string;
  triggerType: 'auto_switch' | 'halftime_ad' | 'fulltime_ad';
  actionType: 'switch_to_hdmi' | 'switch_back' | 'trigger_ad';
  actionConfig: Record<string, any>;
  executedAt?: Date;
  executionStatus: 'pending' | 'executed' | 'failed';
  createdAt: Date;
}

// Analytics & Smart Counter
export interface SmartCounterEvent {
  id: string;
  cafeId?: string; // Optional for system-wide events
  deviceId?: string;
  contentId?: string;
  adId?: string;
  playlistId?: string;
  eventType: 
    | 'content_start' 
    | 'content_complete' 
    | 'content_skip' 
    | 'ad_impression' 
    | 'ad_click' 
    | 'ad_complete'
    | 'layer_change'
    | 'device_heartbeat'
    | 'match_trigger';
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  estimatedViewers?: number;
}

// Layer Manager Commands
export interface LayerCommand {
  commandId: string;
  deviceId: string;
  layerNumber: 1 | 2 | 3 | 4;
  action: 
    | 'activate' 
    | 'deactivate' 
    | 'update_content' 
    | 'change_playlist'
    | 'set_volume'
    | 'switch_hdmi'
    | 'trigger_ad';
  payload: Record<string, any>;
  priority: number;
  timestamp: Date;
  expiresAt?: Date;
}

// WebSocket Events
export interface WebSocketMessage {
  type: 
    | 'layer_update' 
    | 'command' 
    | 'status_update' 
    | 'heartbeat' 
    | 'ad_trigger'
    | 'match_event'
    | 'error';
  payload: Record<string, any>;
  timestamp: Date;
  deviceId?: string;
  cafeId?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Real-time Device Status
export interface DeviceStatus {
  deviceId: string;
  online: boolean;
  currentLayers: CurrentLayersState;
  systemInfo?: {
    cpuUsage: number;
    memoryUsage: number;
    storageUsage: number;
    temperature?: number;
  };
  networkInfo?: {
    connected: boolean;
    signalStrength?: number;
    ipAddress?: string;
  };
  lastUpdate: Date;
}
