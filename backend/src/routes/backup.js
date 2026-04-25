import express from 'express';
import { createBackup, restoreBackup, listBackups, getBackupStats, exportTable, verifyBackup } from '../utils/backup.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// BACKUP MANAGEMENT ROUTES (Admin Only)
// ============================================

/**
 * GET backup statistics
 * Admin only
 */
router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const stats = getBackupStats();
    logger.info('Admin retrieved backup statistics');

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Error getting backup stats:', error);
    res.status(500).json({
      error: 'Failed to get backup statistics',
      message: error.message
    });
  }
});

/**
 * CREATE new backup
 * Admin only
 */
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const backup = await createBackup();

    if (!backup) {
      return res.status(500).json({
        error: 'Failed to create backup'
      });
    }

    logger.info(`Admin created backup: ${backup.filename}`);

    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      backup: backup
    });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({
      error: 'Failed to create backup',
      message: error.message
    });
  }
});

/**
 * LIST all backups
 * Admin only
 */
router.get('/list', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const backups = listBackups();
    logger.info(`Admin listed ${backups.length} backups`);

    res.json({
      success: true,
      count: backups.length,
      backups: backups
    });
  } catch (error) {
    logger.error('Error listing backups:', error);
    res.status(500).json({
      error: 'Failed to list backups',
      message: error.message
    });
  }
});

/**
 * VERIFY backup integrity
 * Admin only
 */
router.get('/verify/:backupFileName', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { backupFileName } = req.params;
    const result = verifyBackup(backupFileName);

    logger.info(`Admin verified backup: ${backupFileName}`);

    res.json({
      success: result.valid,
      verification: result
    });
  } catch (error) {
    logger.error('Error verifying backup:', error);
    res.status(500).json({
      error: 'Failed to verify backup',
      message: error.message
    });
  }
});

/**
 * RESTORE database from backup
 * Admin only - DANGEROUS operation!
 */
router.post('/restore/:backupFileName', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { backupFileName } = req.params;
    const { confirm } = req.body;

    if (confirm !== true) {
      return res.status(400).json({
        error: 'Restore operation must be confirmed',
        message: 'Send { confirm: true } to restore database'
      });
    }

    logger.warn(`Admin initiating database restore from: ${backupFileName}`);

    const result = await restoreBackup(backupFileName);

    logger.info(`Admin restored database from: ${backupFileName}`);

    res.json({
      success: true,
      message: 'Database restored successfully',
      result: result
    });
  } catch (error) {
    logger.error('Error restoring backup:', error);
    res.status(500).json({
      error: 'Failed to restore backup',
      message: error.message
    });
  }
});

/**
 * EXPORT table as CSV
 * Admin only
 */
router.post('/export/:tableName', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { outputFile } = req.body;

    // Validate table name (prevent SQL injection)
    const validTables = ['users', 'quotes', 'audio_files', 'ads', 'subscriptions', 'audio_sessions', 'achievements'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({
        error: 'Invalid table name',
        validTables: validTables
      });
    }

    const result = await exportTable(tableName, outputFile);

    logger.info(`Admin exported table: ${tableName}`);

    res.json({
      success: result.success,
      export: result
    });
  } catch (error) {
    logger.error('Error exporting table:', error);
    res.status(500).json({
      error: 'Failed to export table',
      message: error.message
    });
  }
});

export default router;
