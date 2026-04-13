import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ads
 * Get all ads
 */
router.get('/', (req, res) => {
  try {
    const ads = db.prepare('SELECT * FROM ads ORDER BY created_at DESC').all();

    res.json({
      success: true,
      ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

/**
 * GET /api/ads/:adId
 * Get specific ad
 */
router.get('/:adId', (req, res) => {
  try {
    const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.adId);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({
      success: true,
      ad
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

/**
 * POST /api/ads/:adId/click
 * Track ad click
 */
router.post('/:adId/click', (req, res) => {
  try {
    const adId = req.params.adId;

    db.prepare('UPDATE ads SET clicks = clicks + 1 WHERE id = ?').run(adId);

    const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);

    res.json({
      success: true,
      message: 'Click tracked',
      ad
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * POST /api/ads
 * Create new ad (admin only)
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, image_url, click_url } = req.body;

    if (!title || !click_url) {
      return res.status(400).json({ error: 'title and click_url required' });
    }

    const adId = uuidv4();

    db.prepare(`
      INSERT INTO ads (id, title, description, image_url, click_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      adId,
      title,
      description || null,
      image_url || null,
      click_url,
      new Date().toISOString()
    );

    const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);

    res.status(201).json({
      success: true,
      message: 'Ad created',
      ad
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

/**
 * PUT /api/ads/:adId
 * Update ad
 */
router.put('/:adId', authMiddleware, (req, res) => {
  try {
    const adId = req.params.adId;
    const { title, description, image_url, click_url } = req.body;

    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url || null);
    }

    if (click_url) {
      updates.push('click_url = ?');
      values.push(click_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(adId);

    db.prepare(`UPDATE ads SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);

    res.json({
      success: true,
      message: 'Ad updated',
      ad
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

/**
 * DELETE /api/ads/:adId
 * Delete ad
 */
router.delete('/:adId', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM ads WHERE id = ?').run(req.params.adId);

    res.json({
      success: true,
      message: 'Ad deleted'
    });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

/**
 * GET /api/ads/:adId/analytics
 * Get ad analytics
 */
router.get('/:adId/analytics', (req, res) => {
  try {
    const ad = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.adId);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions * 100).toFixed(2) : 0;

    res.json({
      success: true,
      analytics: {
        adId: ad.id,
        title: ad.title,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: `${ctr}%`
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;