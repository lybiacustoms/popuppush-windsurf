const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mp3|mov|avi|wav|jpg|jpeg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only media files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter
});

// Get all content
router.get('/', (req, res) => {
  const { cafeId, type, category, status } = req.query;
  const db = global.db;
  
  let content = db.content;
  
  if (cafeId) {
    content = content.filter(c => c.cafeId === cafeId);
  }
  if (type) {
    content = content.filter(c => c.type === type);
  }
  if (category) {
    content = content.filter(c => c.category === category);
  }
  if (status) {
    content = content.filter(c => c.status === status);
  }
  
  res.json({ content });
});

// Get single content item
router.get('/:id', (req, res) => {
  const db = global.db;
  const item = db.content.find(c => c.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  res.json({ content: item });
});

// Upload content
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const {
      title,
      description,
      cafeId,
      category = 'general',
      tags = '',
      duration = 0
    } = req.body;
    
    const db = global.db;
    
    const type = req.file.mimetype.startsWith('video/') ? 'video' :
                 req.file.mimetype.startsWith('audio/') ? 'audio' : 'image';
    
    const contentItem = {
      id: Date.now().toString(),
      title: title || req.file.originalname,
      description: description || '',
      cafeId,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      type,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      duration: parseInt(duration) || 0,
      status: 'active',
      uploadDate: new Date(),
      playCount: 0,
      thumbnail: null // Could generate thumbnail for videos
    };
    
    db.content.push(contentItem);
    
    res.status(201).json({
      message: 'Content uploaded successfully',
      content: contentItem
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update content metadata
router.put('/:id', (req, res) => {
  const db = global.db;
  const index = db.content.findIndex(c => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  const updates = req.body;
  db.content[index] = {
    ...db.content[index],
    ...updates,
    updatedAt: new Date()
  };
  
  res.json({
    message: 'Content updated',
    content: db.content[index]
  });
});

// Delete content
router.delete('/:id', (req, res) => {
  const db = global.db;
  const index = db.content.findIndex(c => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Content not found' });
  }
  
  const item = db.content[index];
  
  // In production, also delete file from disk
  // const fs = require('fs');
  // fs.unlinkSync(`uploads/${item.filename}`);
  
  db.content.splice(index, 1);
  
  res.json({ message: 'Content deleted' });
});

// Get content categories
router.get('/categories/list', (req, res) => {
  const db = global.db;
  const categories = [...new Set(db.content.map(c => c.category))];
  
  res.json({ categories });
});

// Bulk upload
router.post('/bulk', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const { cafeId, category = 'general' } = req.body;
    const db = global.db;
    
    const uploadedItems = req.files.map(file => {
      const type = file.mimetype.startsWith('video/') ? 'video' :
                   file.mimetype.startsWith('audio/') ? 'audio' : 'image';
      
      const item = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: file.originalname,
        description: '',
        cafeId,
        category,
        tags: [],
        type,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        duration: 0,
        status: 'active',
        uploadDate: new Date(),
        playCount: 0,
        thumbnail: null
      };
      
      db.content.push(item);
      return item;
    });
    
    res.status(201).json({
      message: `${uploadedItems.length} files uploaded`,
      content: uploadedItems
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Bulk upload failed' });
  }
});

module.exports = router;
