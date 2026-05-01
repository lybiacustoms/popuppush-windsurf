const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, cafeName } = req.body;
    
    // Validation
    if (!email || !password || !name || !cafeName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const db = req.app.get('db') || global.db;
    
    // Check if user exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create cafe
    const cafeId = Date.now().toString();
    const cafe = {
      id: cafeId,
      name: cafeName,
      createdAt: new Date(),
      settings: {
        theme: 'default',
        language: 'ar',
        timezone: 'Asia/Riyadh'
      }
    };
    db.cafes.push(cafe);
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      cafeId,
      role: 'admin',
      createdAt: new Date()
    };
    db.users.push(user);
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, cafeId: user.cafeId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        cafeId: user.cafeId,
        cafe: cafe
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const db = req.app.get('db') || global.db;
    
    // Find user
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, cafeId: user.cafeId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    const cafe = db.cafes.find(c => c.id === user.cafeId);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        cafeId: user.cafeId,
        cafe: cafe
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const db = req.app.get('db') || global.db;
  const user = db.users.find(u => u.id === req.userId);
  const cafe = db.cafes.find(c => c.id === req.cafeId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      cafeId: user.cafeId,
      cafe: cafe
    }
  });
});

// Middleware to authenticate requests
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.cafeId = decoded.cafeId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = router;
