const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cron = require('node-cron');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Static files for media
app.use('/uploads', express.static('uploads'));

// Database connection (simplified for now - will use in-memory for demo)
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected');
    } else {
      console.log('No MongoDB URI - running in memory mode');
    }
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cafes', require('./routes/cafes'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/content', require('./routes/content'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/schedule', require('./routes/schedule'));

// In-memory storage for demo (replace with DB in production)
const db = {
  cafes: [],
  devices: [],
  content: [],
  playlists: [],
  schedules: [],
  users: [],
  activeConnections: new Map()
};

// Make db available globally
global.db = db;

// Socket.IO for real-time control
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Device registration
  socket.on('device:register', (data) => {
    const { deviceId, cafeId, deviceInfo } = data;
    db.activeConnections.set(deviceId, {
      socketId: socket.id,
      cafeId,
      deviceInfo,
      connectedAt: new Date(),
      status: 'online'
    });
    socket.deviceId = deviceId;
    socket.cafeId = cafeId;
    console.log(`Device ${deviceId} registered`);
    
    // Send current playlist to device
    const playlist = getCurrentPlaylist(cafeId);
    socket.emit('playlist:update', playlist);
  });
  
  // Remote control commands
  socket.on('command:play', (data) => {
    const { deviceId } = data;
    const device = db.activeConnections.get(deviceId);
    if (device) {
      io.to(device.socketId).emit('command:play');
    }
  });
  
  socket.on('command:pause', (data) => {
    const { deviceId } = data;
    const device = db.activeConnections.get(deviceId);
    if (device) {
      io.to(device.socketId).emit('command:pause');
    }
  });
  
  socket.on('command:next', (data) => {
    const { deviceId } = data;
    const device = db.activeConnections.get(deviceId);
    if (device) {
      io.to(device.socketId).emit('command:next');
    }
  });
  
  socket.on('command:volume', (data) => {
    const { deviceId, volume } = data;
    const device = db.activeConnections.get(deviceId);
    if (device) {
      io.to(device.socketId).emit('command:volume', { volume });
    }
  });
  
  socket.on('command:playlist', (data) => {
    const { deviceId, playlistId } = data;
    const device = db.activeConnections.get(deviceId);
    if (device) {
      const playlist = db.playlists.find(p => p.id === playlistId);
      if (playlist) {
        io.to(device.socketId).emit('playlist:update', playlist);
      }
    }
  });
  
  // Device status updates
  socket.on('device:status', (data) => {
    const { currentMedia, position, volume, isPlaying } = data;
    if (socket.deviceId) {
      const device = db.activeConnections.get(socket.deviceId);
      if (device) {
        device.status = 'online';
        device.lastStatus = {
          currentMedia,
          position,
          volume,
          isPlaying,
          timestamp: new Date()
        };
      }
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.deviceId) {
      const device = db.activeConnections.get(socket.deviceId);
      if (device) {
        device.status = 'offline';
        device.disconnectedAt = new Date();
      }
      console.log(`Device ${socket.deviceId} disconnected`);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });
});

// Get current playlist based on schedule
function getCurrentPlaylist(cafeId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Find active schedule
  const schedule = db.schedules.find(s => {
    if (s.cafeId !== cafeId) return false;
    if (!s.active) return false;
    if (!s.days.includes(dayOfWeek)) return false;
    const startMinutes = parseInt(s.startTime.split(':')[0]) * 60 + parseInt(s.startTime.split(':')[1]);
    const endMinutes = parseInt(s.endTime.split(':')[0]) * 60 + parseInt(s.endTime.split(':')[1]);
    return currentTime >= startMinutes && currentTime < endMinutes;
  });
  
  if (schedule) {
    return db.playlists.find(p => p.id === schedule.playlistId) || getDefaultPlaylist();
  }
  
  return getDefaultPlaylist();
}

function getDefaultPlaylist() {
  return {
    id: 'default',
    name: 'Default Playlist',
    items: db.content.slice(0, 5).map(c => ({
      contentId: c.id,
      url: c.url,
      type: c.type,
      duration: c.duration
    }))
  };
}

// Schedule checker - runs every minute
cron.schedule('* * * * *', () => {
  console.log('Checking schedules...');
  
  db.cafes.forEach(cafe => {
    const activePlaylist = getCurrentPlaylist(cafe.id);
    const cafeDevices = Array.from(db.activeConnections.entries())
      .filter(([_, device]) => device.cafeId === cafe.id);
    
    cafeDevices.forEach(([deviceId, device]) => {
      io.to(device.socketId).emit('playlist:update', activePlaylist);
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    activeDevices: db.activeConnections.size
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});

module.exports = { app, io, db };
