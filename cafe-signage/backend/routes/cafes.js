const express = require('express');
const router = express.Router();

// Get all cafes
router.get('/', (req, res) => {
  const db = global.db;
  
  // Remove sensitive data
  const cafes = db.cafes.map(c => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt,
    settings: c.settings
  }));
  
  res.json({ cafes });
});

// Get single cafe with stats
router.get('/:id', (req, res) => {
  const db = global.db;
  const cafe = db.cafes.find(c => c.id === req.params.id);
  
  if (!cafe) {
    return res.status(404).json({ error: 'Cafe not found' });
  }
  
  // Get related data
  const deviceCount = db.devices.filter(d => d.cafeId === cafe.id).length;
  const contentCount = db.content.filter(c => c.cafeId === cafe.id).length;
  const playlistCount = db.playlists.filter(p => p.cafeId === cafe.id).length;
  const scheduleCount = db.schedules.filter(s => s.cafeId === cafe.id).length;
  
  res.json({
    cafe: {
      ...cafe,
      stats: {
        devices: deviceCount,
        content: contentCount,
        playlists: playlistCount,
        schedules: scheduleCount
      }
    }
  });
});

// Update cafe settings
router.put('/:id', (req, res) => {
  const db = global.db;
  const index = db.cafes.findIndex(c => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Cafe not found' });
  }
  
  const allowedUpdates = ['name', 'settings'];
  const updates = {};
  
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  });
  
  db.cafes[index] = {
    ...db.cafes[index],
    ...updates,
    updatedAt: new Date()
  };
  
  res.json({
    message: 'Cafe updated',
    cafe: db.cafes[index]
  });
});

// Get cafe dashboard stats
router.get('/:id/dashboard', (req, res) => {
  const db = global.db;
  const cafeId = req.params.id;
  
  const cafe = db.cafes.find(c => c.id === cafeId);
  if (!cafe) {
    return res.status(404).json({ error: 'Cafe not found' });
  }
  
  // Device stats
  const devices = db.devices.filter(d => d.cafeId === cafeId);
  const onlineDevices = devices.filter(d => db.activeConnections.has(d.id));
  
  // Content stats
  const content = db.content.filter(c => c.cafeId === cafeId);
  const videoCount = content.filter(c => c.type === 'video').length;
  const audioCount = content.filter(c => c.type === 'audio').length;
  
  // Recent activity (mock)
  const recentActivity = [
    { time: new Date(Date.now() - 300000), event: 'Device connected', device: 'Main Screen' },
    { time: new Date(Date.now() - 600000), event: 'Playlist changed', device: 'System' },
    { time: new Date(Date.now() - 900000), event: 'Content uploaded', device: 'System' },
  ];
  
  res.json({
    stats: {
      devices: {
        total: devices.length,
        online: onlineDevices.length,
        offline: devices.length - onlineDevices.length
      },
      content: {
        total: content.length,
        video: videoCount,
        audio: audioCount
      },
      playlists: db.playlists.filter(p => p.cafeId === cafeId).length,
      activeSchedules: db.schedules.filter(s => s.cafeId === cafeId && s.active).length
    },
    recentActivity
  });
});

// Get all data for a cafe (for export/backup)
router.get('/:id/export', (req, res) => {
  const db = global.db;
  const cafeId = req.params.id;
  
  const exportData = {
    cafe: db.cafes.find(c => c.id === cafeId),
    devices: db.devices.filter(d => d.cafeId === cafeId),
    content: db.content.filter(c => c.cafeId === cafeId),
    playlists: db.playlists.filter(p => p.cafeId === cafeId),
    schedules: db.schedules.filter(s => s.cafeId === cafeId),
    exportedAt: new Date()
  };
  
  res.json(exportData);
});

module.exports = router;
