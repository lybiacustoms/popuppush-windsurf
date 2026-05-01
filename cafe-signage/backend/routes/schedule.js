const express = require('express');
const router = express.Router();

// Days mapping (0 = Sunday, 6 = Saturday)
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get all schedules
router.get('/', (req, res) => {
  const { cafeId, active } = req.query;
  const db = global.db;
  
  let schedules = cafeId 
    ? db.schedules.filter(s => s.cafeId === cafeId)
    : db.schedules;
  
  if (active !== undefined) {
    schedules = schedules.filter(s => s.active === (active === 'true'));
  }
  
  // Add playlist names
  schedules = schedules.map(s => {
    const playlist = db.playlists.find(p => p.id === s.playlistId);
    return {
      ...s,
      playlistName: playlist?.name || 'Unknown'
    };
  });
  
  res.json({ schedules });
});

// Get current schedule for a cafe
router.get('/current', (req, res) => {
  const { cafeId } = req.query;
  
  if (!cafeId) {
    return res.status(400).json({ error: 'cafeId required' });
  }
  
  const currentSchedule = getCurrentSchedule(cafeId);
  
  if (!currentSchedule) {
    return res.json({ 
      active: false,
      message: 'No active schedule for current time'
    });
  }
  
  res.json({
    active: true,
    schedule: currentSchedule
  });
});

// Create schedule
router.post('/', (req, res) => {
  const {
    name,
    cafeId,
    playlistId,
    days, // [0, 1, 2] for Sunday, Monday, Tuesday
    startTime, // "08:00"
    endTime, // "22:00"
    priority = 1,
    active = true,
    devices = [] // specific devices, empty = all devices
  } = req.body;
  
  if (!name || !cafeId || !playlistId || !days || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, cafeId, playlistId, days, startTime, endTime' 
    });
  }
  
  const db = global.db;
  
  const schedule = {
    id: Date.now().toString(),
    name,
    cafeId,
    playlistId,
    days: Array.isArray(days) ? days : [days],
    startTime,
    endTime,
    priority,
    active,
    devices: Array.isArray(devices) ? devices : [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.schedules.push(schedule);
  
  res.status(201).json({
    message: 'Schedule created',
    schedule
  });
});

// Update schedule
router.put('/:id', (req, res) => {
  const db = global.db;
  const index = db.schedules.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const updates = req.body;
  
  db.schedules[index] = {
    ...db.schedules[index],
    ...updates,
    updatedAt: new Date()
  };
  
  res.json({
    message: 'Schedule updated',
    schedule: db.schedules[index]
  });
});

// Delete schedule
router.delete('/:id', (req, res) => {
  const db = global.db;
  const index = db.schedules.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  db.schedules.splice(index, 1);
  
  res.json({ message: 'Schedule deleted' });
});

// Bulk create schedules (for quick setup)
router.post('/bulk', (req, res) => {
  const { schedules, cafeId } = req.body;
  
  if (!schedules || !Array.isArray(schedules)) {
    return res.status(400).json({ error: 'schedules array required' });
  }
  
  const db = global.db;
  const created = [];
  
  schedules.forEach(s => {
    const schedule = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      cafeId,
      ...s,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.schedules.push(schedule);
    created.push(schedule);
  });
  
  res.status(201).json({
    message: `${created.length} schedules created`,
    schedules: created
  });
});

// Get schedule timeline for a day
router.get('/timeline/:cafeId', (req, res) => {
  const { cafeId } = req.params;
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  
  const dayOfWeek = new Date(date).getDay();
  const db = global.db;
  
  const daySchedules = db.schedules.filter(s => 
    s.cafeId === cafeId && 
    s.active && 
    s.days.includes(dayOfWeek)
  ).sort((a, b) => a.priority - b.priority || a.startTime.localeCompare(b.startTime));
  
  // Build timeline
  const timeline = [];
  let lastEnd = "00:00";
  
  daySchedules.forEach(s => {
    // Add gap if exists
    if (s.startTime > lastEnd) {
      timeline.push({
        type: 'gap',
        start: lastEnd,
        end: s.startTime
      });
    }
    
    const playlist = db.playlists.find(p => p.id === s.playlistId);
    
    timeline.push({
      type: 'schedule',
      id: s.id,
      name: s.name,
      playlistId: s.playlistId,
      playlistName: playlist?.name || 'Unknown',
      start: s.startTime,
      end: s.endTime
    });
    
    lastEnd = s.endTime;
  });
  
  // Add final gap if needed
  if (lastEnd < "23:59") {
    timeline.push({
      type: 'gap',
      start: lastEnd,
      end: "23:59"
    });
  }
  
  res.json({ timeline, date, dayOfWeek: DAYS[dayOfWeek] });
});

// Helper function to get current schedule
function getCurrentSchedule(cafeId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  
  const db = global.db;
  
  const activeSchedules = db.schedules.filter(s => {
    if (s.cafeId !== cafeId) return false;
    if (!s.active) return false;
    if (!s.days.includes(dayOfWeek)) return false;
    return currentTime >= s.startTime && currentTime < s.endTime;
  });
  
  // Return highest priority schedule
  return activeSchedules.sort((a, b) => b.priority - a.priority)[0] || null;
}

module.exports = router;
