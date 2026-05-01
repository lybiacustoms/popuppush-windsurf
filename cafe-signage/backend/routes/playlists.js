const express = require('express');
const router = express.Router();

// Get all playlists
router.get('/', (req, res) => {
  const { cafeId } = req.query;
  const db = global.db;
  
  let playlists = cafeId 
    ? db.playlists.filter(p => p.cafeId === cafeId)
    : db.playlists;
  
  res.json({ playlists });
});

// Get single playlist with full content details
router.get('/:id', (req, res) => {
  const db = global.db;
  const playlist = db.playlists.find(p => p.id === req.params.id);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  // Get full content details
  const itemsWithDetails = playlist.items.map(item => {
    const content = db.content.find(c => c.id === item.contentId);
    return {
      ...item,
      content: content || null
    };
  });
  
  res.json({
    playlist: {
      ...playlist,
      items: itemsWithDetails
    }
  });
});

// Create playlist
router.post('/', (req, res) => {
  const { name, description, cafeId, items = [], settings = {} } = req.body;
  
  if (!name || !cafeId) {
    return res.status(400).json({ error: 'Name and cafeId required' });
  }
  
  const db = global.db;
  
  const playlist = {
    id: Date.now().toString(),
    name,
    description: description || '',
    cafeId,
    items: items.map((item, index) => ({
      id: Date.now().toString() + index,
      contentId: item.contentId,
      order: index,
      duration: item.duration || null, // null means play full duration
      transition: item.transition || 'fade',
      repeat: item.repeat || 1
    })),
    settings: {
      shuffle: settings.shuffle || false,
      loop: settings.loop || true,
      autoAdvance: settings.autoAdvance || true,
      defaultTransition: settings.defaultTransition || 'fade',
      ...settings
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.playlists.push(playlist);
  
  res.status(201).json({
    message: 'Playlist created',
    playlist
  });
});

// Update playlist
router.put('/:id', (req, res) => {
  const db = global.db;
  const index = db.playlists.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  const updates = req.body;
  
  // If items provided, normalize them
  if (updates.items) {
    updates.items = updates.items.map((item, index) => ({
      id: item.id || Date.now().toString() + index,
      contentId: item.contentId,
      order: index,
      duration: item.duration || null,
      transition: item.transition || updates.settings?.defaultTransition || 'fade',
      repeat: item.repeat || 1
    }));
  }
  
  db.playlists[index] = {
    ...db.playlists[index],
    ...updates,
    updatedAt: new Date()
  };
  
  res.json({
    message: 'Playlist updated',
    playlist: db.playlists[index]
  });
});

// Delete playlist
router.delete('/:id', (req, res) => {
  const db = global.db;
  const index = db.playlists.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  db.playlists.splice(index, 1);
  
  res.json({ message: 'Playlist deleted' });
});

// Add item to playlist
router.post('/:id/items', (req, res) => {
  const { contentId, duration, transition, repeat = 1 } = req.body;
  const db = global.db;
  
  const playlist = db.playlists.find(p => p.id === req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  const item = {
    id: Date.now().toString(),
    contentId,
    order: playlist.items.length,
    duration: duration || null,
    transition: transition || playlist.settings.defaultTransition,
    repeat
  };
  
  playlist.items.push(item);
  playlist.updatedAt = new Date();
  
  res.status(201).json({
    message: 'Item added to playlist',
    item
  });
});

// Reorder playlist items
router.put('/:id/reorder', (req, res) => {
  const { itemIds } = req.body; // Array of item IDs in new order
  const db = global.db;
  
  const playlist = db.playlists.find(p => p.id === req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  // Reorder items based on provided IDs
  const reorderedItems = itemIds.map((id, index) => {
    const item = playlist.items.find(i => i.id === id || i.contentId === id);
    if (item) {
      return { ...item, order: index };
    }
    return null;
  }).filter(Boolean);
  
  playlist.items = reorderedItems;
  playlist.updatedAt = new Date();
  
  res.json({
    message: 'Playlist reordered',
    playlist
  });
});

// Duplicate playlist
router.post('/:id/duplicate', (req, res) => {
  const db = global.db;
  const playlist = db.playlists.find(p => p.id === req.params.id);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  const newPlaylist = {
    ...playlist,
    id: Date.now().toString(),
    name: `${playlist.name} (Copy)`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.playlists.push(newPlaylist);
  
  res.status(201).json({
    message: 'Playlist duplicated',
    playlist: newPlaylist
  });
});

// Get playlist preview (URLs for player)
router.get('/:id/preview', (req, res) => {
  const db = global.db;
  const playlist = db.playlists.find(p => p.id === req.params.id);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  const previewItems = playlist.items.map(item => {
    const content = db.content.find(c => c.id === item.contentId);
    if (!content) return null;
    
    return {
      id: item.id,
      url: content.url,
      type: content.type,
      title: content.title,
      duration: item.duration || content.duration,
      transition: item.transition,
      repeat: item.repeat
    };
  }).filter(Boolean);
  
  res.json({
    playlist: {
      id: playlist.id,
      name: playlist.name,
      settings: playlist.settings,
      items: previewItems
    }
  });
});

module.exports = router;
