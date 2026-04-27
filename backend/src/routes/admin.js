import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import db from '../models/database.js';
import logger from '../utils/logger.js';
import { uploadAudioToCloudinary } from '../services/cloudinary.js';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  dest: 'temp/', // Temporary storage before Cloudinary upload
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// ============================================
// ADMIN AUDIO FILES MANAGEMENT
// ============================================

/**
 * GET all audio files with stats
 * Admin only
 */
router.get('/audio', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const audioFiles = db.prepare(`
      SELECT id, title, description, file_url, duration_seconds, 
             category, is_premium, plays, created_at, updated_at
      FROM audio_files
      ORDER BY created_at DESC
    `).all();

    logger.info(`Admin retrieved ${audioFiles.length} audio files`);

    res.json({
      success: true,
      count: audioFiles.length,
      audioFiles: audioFiles
    });
  } catch (error) {
    logger.error('Error fetching admin audio files:', error);
    res.status(500).json({
      error: 'Failed to fetch audio files',
      message: error.message
    });
  }
});

/**
 * CREATE new audio file
 * Admin only
 */
router.post('/audio', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, description, file_url, duration_seconds, category, is_premium } = req.body;

    // Validate required fields
    if (!title || !file_url) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title and file_url are required',
        required: ['title', 'file_url']
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, is_premium, plays, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description || null,
      file_url,
      duration_seconds || 0,
      category || 'Uncategorized',
      is_premium ? 1 : 0,
      0,
      now,
      now
    );

    const newAudio = db.prepare('SELECT * FROM audio_files WHERE id = ?').get(id);

    logger.info(`Admin created new audio file: ${title} (${id})`);

    res.status(201).json({
      success: true,
      message: 'Audio file created successfully',
      audioFile: newAudio
    });
  } catch (error) {
    logger.error('Error creating audio file:', error);
    res.status(500).json({
      error: 'Failed to create audio file',
      message: error.message
    });
  }
});

/**
 * UPDATE audio file
 * Admin only
 */
router.put('/audio/:audioId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { audioId } = req.params;
    const { title, description, file_url, duration_seconds, category, is_premium } = req.body;

    // Check if audio exists
    const audio = db.prepare('SELECT id FROM audio_files WHERE id = ?').get(audioId);
    if (!audio) {
      return res.status(404).json({
        error: 'Audio file not found',
        audioId: audioId
      });
    }

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (file_url !== undefined) {
      updates.push('file_url = ?');
      values.push(file_url);
    }
    if (duration_seconds !== undefined) {
      updates.push('duration_seconds = ?');
      values.push(duration_seconds);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (is_premium !== undefined) {
      updates.push('is_premium = ?');
      values.push(is_premium ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(audioId);

    const sql = `UPDATE audio_files SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedAudio = db.prepare('SELECT * FROM audio_files WHERE id = ?').get(audioId);

    logger.info(`Admin updated audio file: ${audioId}`);

    res.json({
      success: true,
      message: 'Audio file updated successfully',
      audioFile: updatedAudio
    });
  } catch (error) {
    logger.error('Error updating audio file:', error);
    res.status(500).json({
      error: 'Failed to update audio file',
      message: error.message
    });
  }
});

/**
 * DELETE audio file
 * Admin only
 */
router.delete('/audio/:audioId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { audioId } = req.params;

    const result = db.prepare('DELETE FROM audio_files WHERE id = ?').run(audioId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Audio file not found',
        audioId: audioId
      });
    }

    logger.info(`Admin deleted audio file: ${audioId}`);

    res.json({
      success: true,
      message: 'Audio file deleted successfully',
      deletedId: audioId
    });
  } catch (error) {
    logger.error('Error deleting audio file:', error);
    res.status(500).json({
      error: 'Failed to delete audio file',
      message: error.message
    });
  }
});

/**
 * UPLOAD audio file to Cloudinary and create record
 * Admin only
 */
router.post('/audio/upload', authMiddleware, adminMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        message: 'Please select an audio file to upload'
      });
    }

    const { title, description, category, is_premium } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title is required',
        required: ['title']
      });
    }

    // Upload to Cloudinary
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const cloudinaryResult = await uploadAudioToCloudinary(req.file.path, fileName);

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload audio to Cloudinary'
      });
    }

    // Clean up temp file
    const fs = await import('fs');
    fs.unlinkSync(req.file.path);

    // Create database record
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, is_premium, plays, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description || null,
      cloudinaryResult.url,
      cloudinaryResult.duration || 0,
      category || 'Uncategorized',
      is_premium ? 1 : 0,
      0,
      now,
      now
    );

    const newAudio = db.prepare('SELECT * FROM audio_files WHERE id = ?').get(id);

    logger.info(`Admin uploaded new audio file: ${title} (${id}) - Cloudinary URL: ${cloudinaryResult.url}`);

    res.status(201).json({
      success: true,
      message: 'Audio file uploaded and created successfully',
      audioFile: newAudio,
      cloudinary: {
        public_id: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes
      }
    });
  } catch (error) {
    logger.error('Error uploading audio file:', error);

    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up temp file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to upload audio file',
      message: error.message
    });
  }
});

// ============================================
// ADMIN QUOTES MANAGEMENT
// ============================================

/**
 * GET all quotes with stats
 * Admin only
 */
router.get('/quotes', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const quotes = db.prepare(`
      SELECT id, text, author, category, source, is_premium, views, created_at
      FROM quotes
      ORDER BY created_at DESC
    `).all();

    logger.info(`Admin retrieved ${quotes.length} quotes`);

    res.json({
      success: true,
      count: quotes.length,
      quotes: quotes
    });
  } catch (error) {
    logger.error('Error fetching admin quotes:', error);
    res.status(500).json({
      error: 'Failed to fetch quotes',
      message: error.message
    });
  }
});

/**
 * CREATE new quote
 * Admin only
 */
router.post('/quotes', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { text, author, category, source, is_premium } = req.body;

    if (!text || !author) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'text and author are required',
        required: ['text', 'author']
      });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO quotes (id, text, author, category, source, is_premium, views)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      text,
      author,
      category || 'wisdom',
      source || null,
      is_premium ? 1 : 0,
      0
    );

    const newQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);

    logger.info(`Admin created new quote by ${author} (${id})`);

    res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      quote: newQuote
    });
  } catch (error) {
    logger.error('Error creating quote:', error);
    res.status(500).json({
      error: 'Failed to create quote',
      message: error.message
    });
  }
});

/**
 * UPDATE quote
 * Admin only
 */
router.put('/quotes/:quoteId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { quoteId } = req.params;
    const { text, author, category, source, is_premium } = req.body;

    const quote = db.prepare('SELECT id FROM quotes WHERE id = ?').get(quoteId);
    if (!quote) {
      return res.status(404).json({
        error: 'Quote not found',
        quoteId: quoteId
      });
    }

    const updates = [];
    const values = [];

    if (text !== undefined) {
      updates.push('text = ?');
      values.push(text);
    }
    if (author !== undefined) {
      updates.push('author = ?');
      values.push(author);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      values.push(source);
    }
    if (is_premium !== undefined) {
      updates.push('is_premium = ?');
      values.push(is_premium ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    values.push(quoteId);
    const sql = `UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);

    logger.info(`Admin updated quote: ${quoteId}`);

    res.json({
      success: true,
      message: 'Quote updated successfully',
      quote: updatedQuote
    });
  } catch (error) {
    logger.error('Error updating quote:', error);
    res.status(500).json({
      error: 'Failed to update quote',
      message: error.message
    });
  }
});

/**
 * DELETE quote
 * Admin only
 */
router.delete('/quotes/:quoteId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { quoteId } = req.params;

    const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(quoteId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Quote not found',
        quoteId: quoteId
      });
    }

    logger.info(`Admin deleted quote: ${quoteId}`);

    res.json({
      success: true,
      message: 'Quote deleted successfully',
      deletedId: quoteId
    });
  } catch (error) {
    logger.error('Error deleting quote:', error);
    res.status(500).json({
      error: 'Failed to delete quote',
      message: error.message
    });
  }
});

// ============================================
// ADMIN ADS MANAGEMENT
// ============================================

/**
 * GET all ads with stats
 * Admin only
 */
router.get('/ads', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ads = db.prepare(`
      SELECT id, title, description, image_url, click_url, 
             impressions, clicks, active, created_at, updated_at
      FROM ads
      ORDER BY created_at DESC
    `).all();

    logger.info(`Admin retrieved ${ads.length} ads`);

    res.json({
      success: true,
      count: ads.length,
      ads: ads
    });
  } catch (error) {
    logger.error('Error fetching admin ads:', error);
    res.status(500).json({
      error: 'Failed to fetch ads',
      message: error.message
    });
  }
});

/**
 * CREATE new ad
 * Admin only
 */
router.post('/ads', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, description, image_url, click_url, active } = req.body;

    if (!title || !click_url) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title and click_url are required',
        required: ['title', 'click_url']
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ads (id, title, description, image_url, click_url, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description || null,
      image_url || null,
      click_url,
      active !== false ? 1 : 0,
      now,
      now
    );

    const newAd = db.prepare('SELECT * FROM ads WHERE id = ?').get(id);

    logger.info(`Admin created new ad: ${title} (${id})`);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad: newAd
    });
  } catch (error) {
    logger.error('Error creating ad:', error);
    res.status(500).json({
      error: 'Failed to create ad',
      message: error.message
    });
  }
});

/**
 * UPDATE ad
 * Admin only
 */
router.put('/ads/:adId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { adId } = req.params;
    const { title, description, image_url, click_url, active } = req.body;

    const ad = db.prepare('SELECT id FROM ads WHERE id = ?').get(adId);
    if (!ad) {
      return res.status(404).json({
        error: 'Ad not found',
        adId: adId
      });
    }

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url);
    }
    if (click_url !== undefined) {
      updates.push('click_url = ?');
      values.push(click_url);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(adId);

    const sql = `UPDATE ads SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedAd = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);

    logger.info(`Admin updated ad: ${adId}`);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad: updatedAd
    });
  } catch (error) {
    logger.error('Error updating ad:', error);
    res.status(500).json({
      error: 'Failed to update ad',
      message: error.message
    });
  }
});

/**
 * DELETE ad
 * Admin only
 */
router.delete('/ads/:adId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { adId } = req.params;

    const result = db.prepare('DELETE FROM ads WHERE id = ?').run(adId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Ad not found',
        adId: adId
      });
    }

    logger.info(`Admin deleted ad: ${adId}`);

    res.json({
      success: true,
      message: 'Ad deleted successfully',
      deletedId: adId
    });
  } catch (error) {
    logger.error('Error deleting ad:', error);
    res.status(500).json({
      error: 'Failed to delete ad',
      message: error.message
    });
  }
});

// ============================================
// ADMIN USERS MANAGEMENT
// ============================================

/**
 * GET all users (limited data for privacy)
 * Admin only
 */
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, username, subscription_type, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    const stats = {
      total_users: users.length,
      premium_users: users.filter(u => u.subscription_type === 'premium').length,
      admins: users.filter(u => u.is_admin === 1).length
    };

    logger.info(`Admin retrieved user list: ${users.length} total`);

    res.json({
      success: true,
      stats: stats,
      users: users
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GRANT admin privileges to user
 * Admin only
 */
router.post('/users/:userId/make-admin', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        userId: userId
      });
    }

    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(userId);

    logger.info(`Admin promoted user to admin: ${user.email} (${userId})`);

    res.json({
      success: true,
      message: `User ${user.email} is now an admin`,
      userId: userId
    });
  } catch (error) {
    logger.error('Error making user admin:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * REVOKE admin privileges from user
 * Admin only
 */
router.post('/users/:userId/revoke-admin', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        userId: userId
      });
    }

    // Prevent revoking own admin status
    if (req.admin.userId === userId) {
      return res.status(400).json({
        error: 'Cannot revoke your own admin privileges'
      });
    }

    db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(userId);

    logger.info(`Admin revoked admin privileges: ${user.email} (${userId})`);

    res.json({
      success: true,
      message: `Admin privileges revoked for ${user.email}`,
      userId: userId
    });
  } catch (error) {
    logger.error('Error revoking admin:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

/**
 * GET dashboard statistics
 * Admin only
 */
router.get('/stats/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const premiumUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE subscription_type = 'premium'").get().count;
    const totalQuotes = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
    const totalAudioFiles = db.prepare('SELECT COUNT(*) as count FROM audio_files').get().count;
    const totalAds = db.prepare('SELECT COUNT(*) as count FROM ads').get().count;
    const totalAudioSessions = db.prepare('SELECT COUNT(*) as count FROM audio_sessions').get().count;

    const stats = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: totalUsers - premiumUsers
      },
      content: {
        quotes: totalQuotes,
        audio_files: totalAudioFiles,
        ads: totalAds
      },
      usage: {
        audio_sessions: totalAudioSessions
      }
    };

    logger.info('Admin accessed dashboard stats');

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

export default router;
