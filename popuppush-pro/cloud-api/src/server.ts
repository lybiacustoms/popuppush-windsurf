import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cron from 'node-cron';
import path from 'path';

// Services
import { DatabaseService } from './services/DatabaseService';
import { LayerManager } from './services/LayerManager';
import { SportsService } from './services/SportsService';
import { Logger } from './utils/Logger';

// Routes
import authRoutes from './routes/auth';
import cafeRoutes from './routes/cafes';
import deviceRoutes from './routes/devices';
import contentRoutes from './routes/content';
import playlistRoutes from './routes/playlists';
import scheduleRoutes from './routes/schedule';
import layerRoutes from './routes/layers';
import sportsRoutes from './routes/sports';
import adRoutes from './routes/ads';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const logger = new Logger('Server');
const db = new DatabaseService();
const redis = db['redis']; // Access Redis from DatabaseService
const layerManager = new LayerManager(io, redis, db);
const sportsService = new SportsService(db, layerManager, process.env.FOOTBALL_API_KEY || '');

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration - allow Dashboard in development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make services available to routes
app.set('db', db);
app.set('layerManager', layerManager);
app.set('sportsService', sportsService);
app.set('io', io);

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cafes', cafeRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/layers', layerRoutes);
app.use('/api/v1/sports', sportsRoutes);
app.use('/api/v1/ads', adRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const activeDevices = await redis.keys('device:*:layers');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeDevices: activeDevices.length,
    uptime: process.uptime()
  });
});

// Dashboard API routes
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await db.getDevicesByCafe('demo-cafe');
    res.json({
      status: 'success',
      data: devices
    });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch devices' });
  }
});

app.get('/api/cafes/:cafeId/stats', async (req, res) => {
  try {
    const { cafeId } = req.params;
    const devices = await db.getDevicesByCafe(cafeId);
    const content = await db.getMediaByCafe(cafeId);
    const analytics = await db.getAnalytics(cafeId, new Date().toISOString().split('T')[0]);
    
    res.json({
      status: 'success',
      data: {
        totalVideos: content.length,
        activeDevices: devices.filter(d => d.status === 'online').length,
        totalViews: analytics?.total_playtime || 0,
        uptime: '24 ساعة'
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
});

app.get('/api/remote-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await db.getRemoteLogs('PP-DEMO-001', limit);
    res.json({
      status: 'success',
      data: logs.map((log: any) => ({
        time: new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ص',
        event: log.action,
        device: 'الشاشة الرئيسية'
      }))
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.json({
      status: 'success',
      data: [
        { time: '10:30 ص', event: 'تم تشغيل وضع المباراة', device: 'الشاشة الرئيسية' },
        { time: '09:15 ص', event: 'تم تفعيل إعلان Pop-up', device: 'النظام' },
        { time: '08:00 ص', event: 'تم تشغيل قائمة الصباح', device: 'الشاشة الرئيسية' },
      ]
    });
  }
});

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Device registration
  socket.on('device:register', async (data: { deviceId: string; cafeId: string; deviceInfo: any }) => {
    try {
      const { deviceId, cafeId, deviceInfo } = data;
      
      // Update device status
      await db.updateDeviceStatus(deviceId, 'online');
      
      // Store socket association
      await redis.setex(`socket:${deviceId}`, 300, socket.id);
      
      // Join device room
      socket.join(`device:${deviceId}`);
      socket.join(`cafe:${cafeId}`);
      
      // Send current layer state
      const layerState = await layerManager.getDeviceLayerState(deviceId);
      socket.emit('layer:init', layerState);
      
      logger.info(`Device ${deviceId} registered from socket ${socket.id}`);
    } catch (error) {
      logger.error('Device registration failed', error);
      socket.emit('error', { message: 'Registration failed' });
    }
  });

  // Device status updates
  socket.on('device:status', async (data: { deviceId: string; status: any }) => {
    try {
      const { deviceId, status } = data;
      
      // Store in Redis for quick access
      await redis.setex(`device:${deviceId}:status`, 60, JSON.stringify(status));
      
      // Broadcast to cafe dashboard
      io.to(`cafe:${status.cafeId}`).emit('device:status_update', {
        deviceId,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Status update failed', error);
    }
  });

  // Layer updates from device
  socket.on('layer:report', async (data: { deviceId: string; layerNumber: number; state: any }) => {
    try {
      await layerManager.updateLayer(data.deviceId, data.layerNumber as 1|2|3|4, data.state);
    } catch (error) {
      logger.error('Layer report failed', error);
    }
  });

  // Command acknowledgment
  socket.on('command:ack', async (data: { commandId: string; deviceId: string; status: string }) => {
    try {
      // Update command queue
      await redis.hset(`command:${data.commandId}`, 'status', data.status);
      await redis.hset(`command:${data.commandId}`, 'ackTime', new Date().toISOString());
      
      // Notify dashboard
      io.to(`cafe:${data.deviceId}`).emit('command:acknowledged', data);
    } catch (error) {
      logger.error('Command ack failed', error);
    }
  });

  // Dashboard connection
  socket.on('dashboard:register', async (data: { cafeId: string; userId: string }) => {
    socket.join(`cafe:${data.cafeId}`);
    
    // Send current state of all devices
    const devices = await db.getCafeDevices(data.cafeId);
    for (const device of devices) {
      const status = await redis.get(`device:${device.id}:status`);
      if (status) {
        socket.emit('device:status_update', {
          deviceId: device.id,
          status: JSON.parse(status)
        });
      }
    }
    
    logger.info(`Dashboard registered for cafe ${data.cafeId}`);
  });

  // Remote app connection
  socket.on('remote:register', async (data: { cafeId: string; userId: string }) => {
    socket.join(`cafe:${data.cafeId}:remote`);
    logger.info(`Remote app registered for cafe ${data.cafeId}`);
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      // Find associated device
      const deviceKey = await redis.keys('socket:*');
      for (const key of deviceKey) {
        const storedSocketId = await redis.get(key);
        if (storedSocketId === socket.id) {
          const deviceId = key.replace('socket:', '');
          await db.updateDeviceStatus(deviceId, 'offline');
          await redis.del(key);
          logger.info(`Device ${deviceId} disconnected`);
          break;
        }
      }
    } catch (error) {
      logger.error('Disconnect handling failed', error);
    }
    
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ============================================================================
// CRON JOBS
// ============================================================================

// Schedule checker - every minute
cron.schedule('* * * * *', async () => {
  try {
    logger.debug('Running schedule checker...');
    
    // Get all active schedules for current time
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();
    
    // Query active schedules
    const query = `
      SELECT * FROM schedules 
      WHERE is_active = true 
      AND $1 = ANY(days_of_week)
      AND start_time <= $2 
      AND end_time > $2
    `;
    const result = await db['pool'].query(query, [currentDay, currentTime]);
    
    for (const schedule of result.rows) {
      // Get playlist
      const playlist = await db.getPlaylist(schedule.playlist_id);
      if (playlist) {
        // Apply to all devices in cafe
        const devices = await db.getCafeDevices(schedule.cafe_id);
        for (const device of devices) {
          if (device.status === 'online') {
            await layerManager.startPlaylist(device.id, playlist, playlist.targetLayer as 1|2|3|4);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Schedule checker failed', error);
  }
});

// Sports event checker - every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    await sportsService.checkUpcomingMatches();
  } catch (error) {
    logger.error('Sports checker failed', error);
  }
});

// Device heartbeat checker - every minute
cron.schedule('* * * * *', async () => {
  try {
    const keys = await redis.keys('socket:*');
    const now = new Date();
    
    for (const key of keys) {
      const socketId = await redis.get(key);
      if (socketId) {
        const deviceId = key.replace('socket:', '');
        const lastHeartbeat = await redis.get(`device:${deviceId}:heartbeat`);
        
        if (lastHeartbeat) {
          const lastBeat = new Date(lastHeartbeat);
          const diffMinutes = (now.getTime() - lastBeat.getTime()) / (1000 * 60);
          
          if (diffMinutes > 5) {
            // Mark as offline
            await db.updateDeviceStatus(deviceId, 'offline');
            await redis.del(key);
            
            io.to(`cafe:${deviceId}`).emit('device:offline', { deviceId });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Heartbeat checker failed', error);
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket ready for connections`);
  logger.info(`⚽ Sports service initialized`);
  
  // Initialize sports monitoring
  try {
    await sportsService.initialize();
  } catch (error) {
    logger.error('Failed to initialize sports service', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
