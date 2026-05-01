const express = require('express');
const router = express.Router();

// Get all devices for a cafe
router.get('/', (req, res) => {
  const { cafeId } = req.query;
  const db = global.db;
  
  let devices = cafeId 
    ? db.devices.filter(d => d.cafeId === cafeId)
    : db.devices;
  
  // Add online status
  devices = devices.map(d => ({
    ...d,
    isOnline: db.activeConnections.has(d.id),
    lastSeen: db.activeConnections.get(d.id)?.lastStatus?.timestamp || d.lastSeen
  }));
  
  res.json({ devices });
});

// Get single device
router.get('/:id', (req, res) => {
  const db = global.db;
  const device = db.devices.find(d => d.id === req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const activeDevice = db.activeConnections.get(device.id);
  
  res.json({
    device: {
      ...device,
      isOnline: !!activeDevice,
      currentStatus: activeDevice?.lastStatus || null
    }
  });
});

// Register new device
router.post('/', (req, res) => {
  const { name, location, cafeId, type = 'android-tv' } = req.body;
  
  if (!name || !cafeId) {
    return res.status(400).json({ error: 'Name and cafeId required' });
  }
  
  const db = global.db;
  
  const device = {
    id: Date.now().toString(),
    name,
    location: location || 'Unknown',
    cafeId,
    type,
    status: 'pending', // pending, active, inactive
    createdAt: new Date(),
    lastSeen: null,
    settings: {
      volume: 70,
      brightness: 100,
      autoPlay: true
    }
  };
  
  db.devices.push(device);
  
  res.status(201).json({
    message: 'Device registered',
    device
  });
});

// Update device
router.put('/:id', (req, res) => {
  const db = global.db;
  const deviceIndex = db.devices.findIndex(d => d.id === req.params.id);
  
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const updates = req.body;
  db.devices[deviceIndex] = {
    ...db.devices[deviceIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  res.json({
    message: 'Device updated',
    device: db.devices[deviceIndex]
  });
});

// Delete device
router.delete('/:id', (req, res) => {
  const db = global.db;
  const deviceIndex = db.devices.findIndex(d => d.id === req.params.id);
  
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  db.devices.splice(deviceIndex, 1);
  db.activeConnections.delete(req.params.id);
  
  res.json({ message: 'Device deleted' });
});

// Send command to device (via WebSocket)
router.post('/:id/command', (req, res) => {
  const { command, data = {} } = req.body;
  const deviceId = req.params.id;
  const db = global.db;
  
  const device = db.activeConnections.get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not online' });
  }
  
  const { io } = require('../server');
  
  const validCommands = ['play', 'pause', 'next', 'previous', 'volume', 'playlist', 'reboot'];
  
  if (!validCommands.includes(command)) {
    return res.status(400).json({ error: 'Invalid command' });
  }
  
  io.to(device.socketId).emit(`command:${command}`, data);
  
  res.json({
    message: `Command ${command} sent to device ${deviceId}`,
    command,
    data
  });
});

// Get device logs/status history
router.get('/:id/logs', (req, res) => {
  // In production, this would fetch from database
  // For now, return mock data
  const logs = [
    { timestamp: new Date(), event: 'Connected', details: '' },
    { timestamp: new Date(Date.now() - 3600000), event: 'Playlist changed', details: 'Morning playlist' },
    { timestamp: new Date(Date.now() - 7200000), event: 'Media started', details: 'Summer drinks ad' },
  ];
  
  res.json({ logs });
});

// Pair device (for initial setup)
router.post('/pair', (req, res) => {
  const { pairCode, cafeId } = req.body;
  
  // In production, verify pairCode against a temporary store
  // For demo, accept any 6-digit code
  if (!pairCode || pairCode.length !== 6) {
    return res.status(400).json({ error: 'Invalid pairing code' });
  }
  
  res.json({
    message: 'Device paired successfully',
    paired: true,
    pairCode
  });
});

module.exports = router;
