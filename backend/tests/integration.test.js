import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';
import db from '../src/models/database.js';

/**
 * Authentication Tests
 */
describe('Authentication API', () => {
  let token;
  let userId;
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.token).toBeDefined();
      
      userId = response.body.user.id;
      token = response.body.token;
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser2',
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});

/**
 * Audio API Tests
 */
describe('Audio API', () => {
  let token;
  let audioId;

  beforeAll(async () => {
    // Register and login test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'audiotest@example.com',
        username: 'audiotest',
        password: 'TestPassword123!'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'audiotest@example.com',
        password: 'TestPassword123!'
      });

    token = loginRes.body.token;
  });

  describe('GET /api/audio', () => {
    it('should get all audio files', async () => {
      const response = await request(app)
        .get('/api/audio')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.audioLibrary)).toBe(true);
      expect(response.body.audioLibrary.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/audio/:audioId', () => {
    it('should get specific audio file', async () => {
      const response = await request(app)
        .get('/api/audio/audio_1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.audio).toBeDefined();
      expect(response.body.audio.title).toBeDefined();
    });

    it('should return 404 for non-existent audio', async () => {
      const response = await request(app)
        .get('/api/audio/invalid_id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/audio/session/start', () => {
    it('should start audio session', async () => {
      const response = await request(app)
        .post('/api/audio/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ audioId: 'audio_1' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
      expect(response.body.session.sessionId).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/audio/session/start')
        .send({ audioId: 'audio_1' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with invalid audioId', async () => {
      const response = await request(app)
        .post('/api/audio/session/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ audioId: 'invalid_id' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });
});

/**
 * Quotes API Tests
 */
describe('Quotes API', () => {
  describe('GET /api/quotes', () => {
    it('should get all quotes', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/quotes/random', () => {
    it('should get random quote', async () => {
      const response = await request(app)
        .get('/api/quotes/random')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.text).toBeDefined();
      expect(response.body.quote.author).toBeDefined();
    });
  });
});

/**
 * Admin API Tests
 */
describe('Admin API', () => {
  let adminToken;
  let adminUserId;
  let audioId;

  beforeAll(async () => {
    // Register admin user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        username: 'admin',
        password: 'AdminPassword123!'
      });

    adminUserId = registerRes.body.user.id;

    // Make user admin
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(adminUserId);

    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });

    adminToken = loginRes.body.token;
  });

  describe('GET /api/admin/stats/dashboard', () => {
    it('should get dashboard stats', async () => {
      const response = await request(app)
        .get('/api/admin/stats/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.users).toBeDefined();
      expect(response.body.stats.content).toBeDefined();
    });

    it('should fail without admin privilege', async () => {
      // Register non-admin user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          username: 'user',
          password: 'UserPassword123!'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'UserPassword123!'
        });

      const response = await request(app)
        .get('/api/admin/stats/dashboard')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Audio Management', () => {
    it('should create new audio file', async () => {
      const response = await request(app)
        .post('/api/admin/audio')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Audio',
          description: 'Test Description',
          file_url: 'https://example.com/test.mp3',
          duration_seconds: 600,
          category: 'Test',
          is_premium: 0
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.audioFile).toBeDefined();
      expect(response.body.audioFile.title).toBe('Test Audio');
      
      audioId = response.body.audioFile.id;
    });

    it('should update audio file', async () => {
      const response = await request(app)
        .put(`/api/admin/audio/${audioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Audio Title'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.audioFile.title).toBe('Updated Audio Title');
    });

    it('should delete audio file', async () => {
      const response = await request(app)
        .delete(`/api/admin/audio/${audioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedId).toBe(audioId);
    });
  });

  describe('Quote Management', () => {
    let quoteId;

    it('should create new quote', async () => {
      const response = await request(app)
        .post('/api/admin/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          text: 'Test quote text',
          author: 'Test Author',
          category: 'test',
          is_premium: 0
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.quote.text).toBe('Test quote text');
      
      quoteId = response.body.quote.id;
    });

    it('should delete quote', async () => {
      const response = await request(app)
        .delete(`/api/admin/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

/**
 * Backup API Tests
 */
describe('Backup API', () => {
  let adminToken;

  beforeAll(async () => {
    // Create admin user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'backup-admin@example.com',
        username: 'backupadmin',
        password: 'BackupPassword123!'
      });

    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(registerRes.body.user.id);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'backup-admin@example.com',
        password: 'BackupPassword123!'
      });

    adminToken = loginRes.body.token;
  });

  describe('GET /api/backup/stats', () => {
    it('should get backup statistics', async () => {
      const response = await request(app)
        .get('/api/backup/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total_backups).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/backup/create', () => {
    it('should create backup', async () => {
      const response = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.backup.filename).toBeDefined();
      expect(response.body.backup.size).toBeGreaterThan(0);
    });
  });
});

/**
 * Error Handling Tests
 */
describe('Error Handling', () => {
  it('should return 404 for non-existent route', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.body.error).toBeDefined();
  });

  it('should handle invalid JSON', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);

    expect(response.body).toBeDefined();
  });

  it('should require authentication for protected routes', async () => {
    const response = await request(app)
      .get('/api/admin/stats/dashboard')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
