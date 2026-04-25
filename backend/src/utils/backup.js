import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './utils/logger.js';

const execPromise = promisify(exec);

/**
 * Database Backup Manager
 * Creates and manages SQLite database backups
 * Supports local backups and cloud storage (coming soon)
 */

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const MAX_LOCAL_BACKUPS = 7; // Keep last 7 days of backups

// ============================================
// Ensure backup directory exists
// ============================================
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  logger.info('✓ Created backups directory');
}

/**
 * Create a backup of the database
 * Filename format: app.db.backup.YYYY-MM-DD.HH-mm-ss.sqlite
 */
export const createBackup = async () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      logger.error('Database file not found:', DB_PATH);
      return null;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `app.db.backup.${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Read the database file
    const dbData = fs.readFileSync(DB_PATH);
    
    // Write backup
    fs.writeFileSync(backupPath, dbData);

    const stats = fs.statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    logger.info(`✓ Backup created: ${backupFileName} (${sizeKB} KB)`);

    // Clean up old backups
    await cleanupOldBackups();

    return {
      success: true,
      filename: backupFileName,
      path: backupPath,
      size: stats.size,
      timestamp: now.toISOString()
    };
  } catch (error) {
    logger.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (backupFileName) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupPath)) {
      logger.error('Backup file not found:', backupPath);
      throw new Error(`Backup not found: ${backupFileName}`);
    }

    // Create backup of current database before restore
    const preRestoreBackup = await createBackup();
    logger.info('Created pre-restore backup:', preRestoreBackup.filename);

    // Restore from backup
    const backupData = fs.readFileSync(backupPath);
    fs.writeFileSync(DB_PATH, backupData);

    logger.info(`✓ Database restored from: ${backupFileName}`);

    return {
      success: true,
      restored: backupFileName,
      preRestoreBackup: preRestoreBackup.filename
    };
  } catch (error) {
    logger.error('Error restoring backup:', error);
    throw error;
  }
};

/**
 * List all available backups
 */
export const listBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sqlite'))
      .sort()
      .reverse();

    const backups = files.map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        created: stats.birthtime || stats.mtime,
        path: filePath
      };
    });

    return backups;
  } catch (error) {
    logger.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Delete old backups (keep only recent ones)
 */
export const cleanupOldBackups = async () => {
  try {
    const backups = listBackups();

    if (backups.length > MAX_LOCAL_BACKUPS) {
      const toDelete = backups.slice(MAX_LOCAL_BACKUPS);

      toDelete.forEach(backup => {
        fs.unlinkSync(backup.path);
        logger.info(`Deleted old backup: ${backup.filename}`);
      });

      logger.info(`✓ Cleaned up ${toDelete.length} old backups`);
    }
  } catch (error) {
    logger.error('Error cleaning up backups:', error);
  }
};

/**
 * Get backup statistics
 */
export const getBackupStats = () => {
  try {
    const backups = listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    return {
      total_backups: backups.length,
      total_size_kb: (totalSize / 1024).toFixed(2),
      total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
      latest_backup: backups.length > 0 ? backups[0] : null,
      oldest_backup: backups.length > 0 ? backups[backups.length - 1] : null,
      backups: backups
    };
  } catch (error) {
    logger.error('Error getting backup stats:', error);
    return null;
  }
};

/**
 * Export database as CSV (for data export)
 */
export const exportTable = async (tableName, outputFile) => {
  try {
    const db = await import('./models/database.js').then(m => m.default);

    // Get table data
    const data = db.prepare(`SELECT * FROM ${tableName}`).all();

    // Convert to CSV
    if (data.length === 0) {
      logger.warn(`Table ${tableName} is empty`);
      return { success: false, message: 'Table is empty' };
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const exportPath = path.join(BACKUP_DIR, outputFile || `${tableName}_export.csv`);
    fs.writeFileSync(exportPath, csv);

    logger.info(`✓ Exported ${tableName}: ${data.length} rows to ${outputFile}`);

    return {
      success: true,
      table: tableName,
      rows: data.length,
      outputFile: outputFile || `${tableName}_export.csv`,
      path: exportPath
    };
  } catch (error) {
    logger.error('Error exporting table:', error);
    throw error;
  }
};

/**
 * Verify backup integrity
 */
export const verifyBackup = (backupFileName) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupPath)) {
      return { valid: false, error: 'Backup file not found' };
    }

    const stats = fs.statSync(backupPath);

    // Check if file is not empty
    if (stats.size === 0) {
      return { valid: false, error: 'Backup file is empty' };
    }

    // Check if file is readable
    try {
      fs.accessSync(backupPath, fs.constants.R_OK);
    } catch {
      return { valid: false, error: 'Backup file is not readable' };
    }

    logger.info(`✓ Backup verified: ${backupFileName}`);

    return {
      valid: true,
      filename: backupFileName,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      created: stats.birthtime || stats.mtime
    };
  } catch (error) {
    logger.error('Error verifying backup:', error);
    return { valid: false, error: error.message };
  }
};

export default {
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  getBackupStats,
  exportTable,
  verifyBackup
};
