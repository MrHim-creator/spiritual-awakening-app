import express from 'express';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { createToken, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate('register'), async (req, res) => {
  try {
    const { email, username, password } = req.validatedData;

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, username, passwordHash, now, now);

    // Create token
    const token = createToken(userId);

    // Auto-create free subscription record
    const subId = uuidv4();
    const expiryDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_type, status, current_period_end, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(subId, userId, 'free', 'active', expiryDate, now, now);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        username,
        subscriptionType: 'free'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validate('login'), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const passwordValid = await bcryptjs.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create token
    const token = createToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionType: 'free'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, username, bio FROM users WHERE id = ?').get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        ...user,
        subscriptionType: 'free'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/auth/me
 * Update user profile
 */
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { username, bio } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (username && (username.length < 3 || username.length > 30)) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }

    // Update user
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT id, email, username, bio FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        ...user,
        subscriptionType: 'free'
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;