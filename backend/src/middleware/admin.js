import db from '../models/database.js';
import logger from '../utils/logger.js';

/**
 * Admin Authorization Middleware
 * Verifies user is authenticated AND has admin role
 * Should be used AFTER authMiddleware
 */
export const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated (from authMiddleware)
    if (!req.user || !req.user.userId) {
      logger.warn('Admin access attempted without authentication');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    const userId = req.user.userId;

    // Check if user has admin role in database
    const user = db.prepare('SELECT id, email FROM users WHERE id = ? AND is_admin = 1').get(userId);

    if (!user) {
      logger.warn(`Unauthorized admin access attempt by user: ${userId}`);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have admin privileges'
      });
    }

    // Add admin info to request
    req.admin = {
      userId: user.id,
      email: user.email
    };

    logger.info(`Admin action by: ${user.email}`);
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      error: 'Authorization error',
      message: error.message
    });
  }
};
