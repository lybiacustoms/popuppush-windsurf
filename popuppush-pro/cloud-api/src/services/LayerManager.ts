import { Server as SocketServer } from 'socket.io';
import { Redis } from 'ioredis';
import { 
  Device, 
  CurrentLayersState, 
  Layer1State, 
  Layer2State, 
  Layer3State, 
  Layer4State,
  LayerCommand,
  HybridAd,
  Playlist
} from '../types';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils/Logger';

/**
 * LayerManager - The core engine for managing the 4-layer display system
 * Handles real-time layer composition, priority management, and device synchronization
 */
export class LayerManager {
  private io: SocketServer;
  private redis: Redis;
  private db: DatabaseService;
  private logger: Logger;
  
  // Layer priority constants (higher = more visible)
  private readonly LAYER_Z_INDEX = {
    LAYER_1_MEDIA: 100,
    LAYER_2_HDMI_IN: 200,
    LAYER_3_POPUP: 300,
    LAYER_4_TICKER: 400
  };

  constructor(io: SocketServer, redis: Redis, db: DatabaseService) {
    this.io = io;
    this.redis = redis;
    this.db = db;
    this.logger = new Logger('LayerManager');
  }

  /**
   * Initialize default layer state for a new device
   */
  public getDefaultLayerState(): CurrentLayersState {
    return {
      layer1Media: {
        active: true,
        zIndex: this.LAYER_Z_INDEX.LAYER_1_MEDIA,
        contentId: null,
        playlistId: null,
        volume: 70,
        isPlaying: false,
        currentPosition: 0
      },
      layer2HdmiIn: {
        active: false,
        zIndex: this.LAYER_Z_INDEX.LAYER_2_HDMI_IN,
        inputSource: null,
        isCapturing: false
      },
      layer3Popup: {
        active: false,
        zIndex: this.LAYER_Z_INDEX.LAYER_3_POPUP,
        contentId: null,
        animation: 'fade',
        position: 'bottom-right',
        displayDuration: 10
      },
      layer4Ticker: {
        active: true,
        zIndex: this.LAYER_Z_INDEX.LAYER_4_TICKER,
        text: '',
        scrollSpeed: 50,
        direction: 'rtl',
        fontSize: 24,
        backgroundColor: 'rgba(0,0,0,0.7)',
        textColor: '#ffffff'
      }
    };
  }

  /**
   * Update a specific layer on a device
   */
  public async updateLayer(
    deviceId: string, 
    layerNumber: 1 | 2 | 3 | 4, 
    updates: Partial<Layer1State | Layer2State | Layer3State | Layer4State>
  ): Promise<void> {
    try {
      // Get current device state
      const device = await this.db.getDevice(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Get current layer state from Redis (faster than DB)
      const cacheKey = `device:${deviceId}:layers`;
      let currentState: CurrentLayersState;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        currentState = JSON.parse(cached);
      } else {
        currentState = device.currentLayers || this.getDefaultLayerState();
      }

      // Update the specific layer
      switch (layerNumber) {
        case 1:
          currentState.layer1Media = { ...currentState.layer1Media, ...updates };
          break;
        case 2:
          currentState.layer2HdmiIn = { ...currentState.layer2HdmiIn, ...updates };
          break;
        case 3:
          currentState.layer3Popup = { ...currentState.layer3Popup, ...updates };
          break;
        case 4:
          currentState.layer4Ticker = { ...currentState.layer4Ticker, ...updates };
          break;
      }

      // Save to Redis (immediate) and DB (async)
      await this.redis.setex(cacheKey, 300, JSON.stringify(currentState)); // 5 min TTL
      await this.db.updateDeviceLayers(deviceId, currentState);

      // Emit to device via WebSocket
      this.io.to(`device:${deviceId}`).emit('layer:update', {
        layerNumber,
        state: this.getLayerByNumber(currentState, layerNumber),
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Layer ${layerNumber} updated for device ${deviceId}`);

    } catch (error) {
      this.logger.error(`Failed to update layer ${layerNumber} for device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Activate a layer (make it visible)
   */
  public async activateLayer(deviceId: string, layerNumber: 1 | 2 | 3 | 4): Promise<void> {
    await this.updateLayer(deviceId, layerNumber, { active: true });
    
    // Log the event
    await this.db.logSmartCounter({
      deviceId,
      eventType: 'layer_change',
      metadata: { action: 'activate', layer: layerNumber }
    });
  }

  /**
   * Deactivate a layer (hide it)
   */
  public async deactivateLayer(deviceId: string, layerNumber: 1 | 2 | 3 | 4): Promise<void> {
    await this.updateLayer(deviceId, layerNumber, { active: false });
    
    await this.db.logSmartCounter({
      deviceId,
      eventType: 'layer_change',
      metadata: { action: 'deactivate', layer: layerNumber }
    });
  }

  /**
   * Switch to HDMI-IN input (for sports matches)
   */
  public async switchToHdmiInput(
    deviceId: string, 
    inputSource: string = 'hdmi0',
    captureSettings?: any
  ): Promise<void> {
    // First, deactivate media layer to avoid conflicts
    await this.deactivateLayer(deviceId, 1);
    
    // Activate HDMI layer
    await this.updateLayer(deviceId, 2, {
      active: true,
      inputSource,
      isCapturing: true,
      captureSettings
    });

    this.logger.info(`Device ${deviceId} switched to HDMI input: ${inputSource}`);
  }

  /**
   * Switch back from HDMI to regular media playback
   */
  public async switchFromHdmiToMedia(deviceId: string, playlistId?: string): Promise<void> {
    // Deactivate HDMI layer
    await this.updateLayer(deviceId, 2, {
      active: false,
      isCapturing: false
    });

    // Reactivate media layer with optional playlist
    const updates: Partial<Layer1State> = { active: true };
    if (playlistId) {
      updates.playlistId = playlistId;
    }
    
    await this.updateLayer(deviceId, 1, updates);

    this.logger.info(`Device ${deviceId} switched from HDMI to media playback`);
  }

  /**
   * Trigger a hybrid ad with priority handling
   */
  public async triggerHybridAd(deviceId: string, ad: HybridAd): Promise<void> {
    try {
      // Check if higher priority content is playing
      const currentState = await this.getDeviceLayerState(deviceId);
      
      // Determine which layer to use based on ad type
      switch (ad.adType) {
        case 'full_video_audio':
          // Take over layer 1 completely
          await this.updateLayer(deviceId, 1, {
            active: true,
            contentId: ad.visualContentId,
            isPlaying: true,
            volume: 100
          });
          break;

        case 'audio_plus_image':
          // Layer 1: Background image, continue with audio
          await this.updateLayer(deviceId, 1, {
            active: true,
            contentId: ad.visualContentId,
            isPlaying: true,
            volume: 80
          });
          break;

        case 'popup_only':
        case 'popup_audio':
          // Use layer 3 for pop-up
          await this.updateLayer(deviceId, 3, {
            active: true,
            contentId: ad.visualContentId,
            animation: 'slide',
            position: 'center',
            displayDuration: ad.displayDuration || 15
          });
          
          // Auto-deactivate after duration
          setTimeout(async () => {
            await this.deactivateLayer(deviceId, 3);
          }, (ad.displayDuration || 15) * 1000);
          break;

        case 'ticker_only':
          // Update ticker text
          await this.updateLayer(deviceId, 4, {
            active: true,
            text: ad.visualContentId || 'Advertisement'
          });
          break;
      }

      // Increment play count
      await this.db.incrementAdPlayCount(ad.id);

      // Log impression
      await this.db.logSmartCounter({
        deviceId,
        adId: ad.id,
        eventType: 'ad_impression',
        metadata: { adType: ad.adType, priority: ad.priority }
      });

      this.logger.info(`Hybrid ad ${ad.id} triggered on device ${deviceId}`);

    } catch (error) {
      this.logger.error(`Failed to trigger hybrid ad on device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Start playlist on a specific layer
   */
  public async startPlaylist(
    deviceId: string, 
    playlist: Playlist, 
    layerNumber: 1 | 2 | 3 | 4 = 1
  ): Promise<void> {
    try {
      if (playlist.items.length === 0) {
        throw new Error('Playlist is empty');
      }

      // Update the appropriate layer
      const updates: any = {
        active: true,
        playlistId: playlist.id,
        isPlaying: true,
        currentPosition: 0
      };

      await this.updateLayer(deviceId, layerNumber, updates);

      // Send playlist content to device
      this.io.to(`device:${deviceId}`).emit('playlist:start', {
        playlistId: playlist.id,
        items: playlist.items,
        settings: playlist.settings,
        layer: layerNumber
      });

      this.logger.info(`Playlist ${playlist.id} started on device ${deviceId}, layer ${layerNumber}`);

    } catch (error) {
      this.logger.error(`Failed to start playlist on device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Get current layer state for a device
   */
  public async getDeviceLayerState(deviceId: string): Promise<CurrentLayersState> {
    const cacheKey = `device:${deviceId}:layers`;
    
    // Try Redis first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const device = await this.db.getDevice(deviceId);
    if (device?.currentLayers) {
      // Cache for future requests
      await this.redis.setex(cacheKey, 300, JSON.stringify(device.currentLayers));
      return device.currentLayers;
    }

    // Return default if nothing found
    return this.getDefaultLayerState();
  }

  /**
   * Handle incoming command from device
   */
  public async handleDeviceCommand(deviceId: string, command: LayerCommand): Promise<void> {
    this.logger.info(`Received command from device ${deviceId}: ${command.action}`);

    switch (command.action) {
      case 'activate':
        await this.activateLayer(deviceId, command.layerNumber);
        break;
      case 'deactivate':
        await this.deactivateLayer(deviceId, command.layerNumber);
        break;
      case 'update_content':
        await this.updateLayer(deviceId, command.layerNumber, command.payload);
        break;
      case 'switch_hdmi':
        await this.switchToHdmiInput(deviceId, command.payload.inputSource);
        break;
      default:
        this.logger.warn(`Unknown command action: ${command.action}`);
    }
  }

  /**
   * Broadcast layer update to all devices in a cafe
   */
  public async broadcastToCafe(
    cafeId: string, 
    layerNumber: 1 | 2 | 3 | 4, 
    updates: Partial<any>
  ): Promise<void> {
    const devices = await this.db.getCafeDevices(cafeId);
    
    for (const device of devices) {
      if (device.status === 'online') {
        await this.updateLayer(device.id, layerNumber, updates);
      }
    }

    this.logger.info(`Broadcasted layer ${layerNumber} update to cafe ${cafeId}`);
  }

  /**
   * Sync layer state across all online devices
   */
  public async syncAllDevices(cafeId: string): Promise<void> {
    const devices = await this.db.getCafeDevices(cafeId);
    const activeDevices = devices.filter(d => d.status === 'online');

    for (const device of activeDevices) {
      const state = await this.getDeviceLayerState(device.id);
      
      this.io.to(`device:${device.id}`).emit('layers:sync', {
        fullState: state,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info(`Synced ${activeDevices.length} devices in cafe ${cafeId}`);
  }

  /**
   * Helper: Get layer by number from state object
   */
  private getLayerByNumber(
    state: CurrentLayersState, 
    layerNumber: number
  ): Layer1State | Layer2State | Layer3State | Layer4State {
    switch (layerNumber) {
      case 1: return state.layer1Media;
      case 2: return state.layer2HdmiIn;
      case 3: return state.layer3Popup;
      case 4: return state.layer4Ticker;
      default: throw new Error(`Invalid layer number: ${layerNumber}`);
    }
  }

  /**
   * Process layer composition for RK3588
   * Returns the final composition configuration
   */
  public async getLayerComposition(deviceId: string): Promise<any> {
    const state = await this.getDeviceLayerState(deviceId);

    // Build composition based on active layers and z-index
    const activeLayers = [
      { number: 1, ...state.layer1Media, zIndex: this.LAYER_Z_INDEX.LAYER_1_MEDIA },
      { number: 2, ...state.layer2HdmiIn, zIndex: this.LAYER_Z_INDEX.LAYER_2_HDMI_IN },
      { number: 3, ...state.layer3Popup, zIndex: this.LAYER_Z_INDEX.LAYER_3_POPUP },
      { number: 4, ...state.layer4Ticker, zIndex: this.LAYER_Z_INDEX.LAYER_4_TICKER }
    ]
    .filter(layer => layer.active)
    .sort((a, b) => a.zIndex - b.zIndex);

    return {
      deviceId,
      layers: activeLayers,
      compositionMode: 'hardware_overlay', // RK3588 hardware composition
      timestamp: new Date().toISOString()
    };
  }
}
