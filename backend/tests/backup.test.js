import { describe, it, expect, beforeEach } from '@jest/globals';
import { createBackup, restoreBackup, listBackups, getBackupStats, verifyBackup } from '../src/utils/backup.js';
import fs from 'fs';
import path from 'path';

describe('Backup Utilities', () => {
  describe('createBackup', () => {
    it('should create a backup file', async () => {
      const backup = await createBackup();
      
      expect(backup).toBeDefined();
      expect(backup.success).toBe(true);
      expect(backup.filename).toBeDefined();
      expect(backup.filename).toMatch(/app\.db\.backup\./);
    });

    it('should create backup with correct size', async () => {
      const backup = await createBackup();
      
      expect(backup.size).toBeGreaterThan(0);
      expect(typeof backup.size).toBe('number');
    });

    it('should include timestamp in backup filename', async () => {
      const backup = await createBackup();
      
      // Filename format: app.db.backup.YYYY-MM-DD.HH-mm-ss.sqlite
      expect(backup.filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('listBackups', () => {
    it('should return array of backups', async () => {
      // Create a backup first
      await createBackup();
      
      const backups = listBackups();
      
      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should include backup metadata', async () => {
      await createBackup();
      const backups = listBackups();
      
      if (backups.length > 0) {
        const backup = backups[0];
        expect(backup.filename).toBeDefined();
        expect(backup.size).toBeDefined();
        expect(backup.sizeKB).toBeDefined();
        expect(backup.created).toBeDefined();
      }
    });

    it('should sort backups by newest first', async () => {
      await createBackup();
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      await createBackup();
      
      const backups = listBackups();
      
      if (backups.length > 1) {
        const time1 = new Date(backups[0].created).getTime();
        const time2 = new Date(backups[1].created).getTime();
        expect(time1).toBeGreaterThanOrEqual(time2);
      }
    });
  });

  describe('verifyBackup', () => {
    it('should verify valid backup', async () => {
      const backup = await createBackup();
      const verification = verifyBackup(backup.filename);
      
      expect(verification.valid).toBe(true);
      expect(verification.filename).toBe(backup.filename);
      expect(verification.size).toBeGreaterThan(0);
    });

    it('should return invalid for non-existent backup', async () => {
      const verification = verifyBackup('nonexistent.sqlite');
      
      expect(verification.valid).toBe(false);
      expect(verification.error).toBeDefined();
    });
  });

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      await createBackup();
      const stats = getBackupStats();
      
      expect(stats).toBeDefined();
      expect(stats.total_backups).toBeGreaterThanOrEqual(0);
      expect(stats.total_size_kb).toBeDefined();
      expect(stats.total_size_mb).toBeDefined();
    });

    it('should calculate total size correctly', async () => {
      await createBackup();
      const stats = getBackupStats();
      
      if (stats.total_backups > 0) {
        const calculatedKB = stats.backups.reduce((sum, b) => sum + b.size, 0) / 1024;
        expect(Math.abs(parseFloat(stats.total_size_kb) - calculatedKB)).toBeLessThan(1);
      }
    });
  });
});
