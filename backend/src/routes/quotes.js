import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { getPaginationParams } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/quotes
 * Get all quotes with pagination and filtering
 */
router.get('/', optionalAuthMiddleware, (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { category, search } = req.query;

    let query = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];

    // Filter by category
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Search by text or author
    if (search) {
      query += ' AND (text LIKE ? OR author LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(/SELECT \*/,'SELECT COUNT(*) as count');
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult.count;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const quotes = db.prepare(query).all(...params);

    res.json({
      success: true,
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

/**
 * GET /api/quotes/random
 * Get a random quote
 */
router.get('/random', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();

    if (!quote) {
      return res.status(404).json({ error: 'No quotes found' });
    }

    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Random quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/quotes/:id
 * Get quote by ID
 */
router.get('/:id', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Increment views
    db.prepare('UPDATE quotes SET views = views + 1 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/quotes/categories/list
 * Get all categories
 */
router.get('/categories/list', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM quotes WHERE category IS NOT NULL ORDER BY category
    `).all();

    res.json({
      success: true,
      categories: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/quotes/:quoteId/favorite
 * Add quote to favorites
 */
router.post('/:quoteId/favorite', authMiddleware, (req, res) => {
  try {
    const { quoteId } = req.params;
    const userId = req.user.userId;

    // Check if quote exists
    const quote = db.prepare('SELECT id FROM quotes WHERE id = ?').get(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check if already favorited
    const existing = db.prepare('SELECT id FROM user_favorites WHERE user_id = ? AND quote_id = ?').get(userId, quoteId);
    if (existing) {
      return res.status(409).json({ error: 'Already in favorites' });
    }

    // Add to favorites
    db.prepare(`
      INSERT INTO user_favorites (id, user_id, quote_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, quoteId, new Date().toISOString());

    res.json({
      success: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

/**
 * DELETE /api/quotes/:quoteId/favorite
 * Remove quote from favorites
 */
router.delete('/:quoteId/favorite', authMiddleware, (req, res) => {
  try {
    const { quoteId } = req.params;
    const userId = req.user.userId;

    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND quote_id = ?').run(userId, quoteId);

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

/**
 * GET /api/quotes/user/favorites
 * Get user's favorite quotes
 */
router.get('/user/favorites', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;

    const favorites = db.prepare(`
      SELECT q.* FROM quotes q
      JOIN user_favorites uf ON q.id = uf.quote_id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
    `).all(userId);

    res.json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router;