import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import db from '../models/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

const router = express.Router();

// ============================================
// GET AUDIO LIBRARY (Public)
// ============================================

router.get('/', optionalAuthMiddleware, (req, res) => {
  try {
    // Fetch audio files from database
    const audioFiles = db.prepare(`
      SELECT id, title, description, file_url, duration_seconds, category, is_premium, plays
      FROM audio_files
      ORDER BY created_at DESC
    `).all();

    // Transform to match frontend expectations
    const audioLibrary = audioFiles.map(audio => ({
      id: audio.id,
      type: audio.category.toLowerCase().includes('meditation') ? 'meditation' : 'frequency',
      title: audio.title,
      duration: audio.duration_seconds,
      category: audio.category,
      description: audio.description,
      is_premium: audio.is_premium === 1,
      plays: audio.plays
    }));

    logger.info(`Audio library fetched: ${audioLibrary.length} files`);

    res.json({
      success: true,
      audioLibrary: audioLibrary
    });
  } catch (error) {
    logger.error('Error fetching audio library:', error);
    res.status(500).json({
      error: 'Failed to fetch audio library',
      message: error.message
    });
  }
});

// ============================================
// GET AUDIO BY ID (Public)
// ============================================

router.get('/:audioId', optionalAuthMiddleware, (req, res) => {
  try {
    const { audioId } = req.params;

    if (!audioId) {
      return res.status(400).json({
        error: 'Missing audioId'
      });
    }

    const audio = db.prepare(`
      SELECT id, title, description, file_url, duration_seconds, category, is_premium, plays
      FROM audio_files
      WHERE id = ?
    `).get(audioId);

    if (!audio) {
      return res.status(404).json({
        error: 'Audio not found',
        audioId: audioId
      });
    }

    // Transform to match frontend expectations
    const audioData = {
      id: audio.id,
      type: audio.category.toLowerCase().includes('meditation') ? 'meditation' : 'frequency',
      title: audio.title,
      duration: audio.duration_seconds,
      category: audio.category,
      description: audio.description,
      file_url: audio.file_url,
      is_premium: audio.is_premium === 1,
      plays: audio.plays
    };

    // Increment play count
    db.prepare('UPDATE audio_files SET plays = plays + 1 WHERE id = ?').run(audioId);

    logger.info(`Audio fetched: ${audio.title} (ID: ${audioId})`);

    res.json({
      success: true,
      audio: audioData
    });
  } catch (error) {
    logger.error('Error fetching audio:', error);
    res.status(500).json({
      error: 'Failed to fetch audio',
      message: error.message
    });
  }
});

// ============================================
// START AUDIO SESSION (Requires Authentication)
// ============================================

router.post('/session/start', authMiddleware, (req, res) => {
  try {
    const { audioId } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!audioId) {
      return res.status(400).json({
        error: 'Missing audioId',
        required: ['audioId']
      });
    }

    // Fetch audio from database
    const audio = db.prepare(`
      SELECT id, title, category, is_premium, duration_seconds
      FROM audio_files
      WHERE id = ?
    `).get(audioId);

    if (!audio) {
      return res.status(404).json({
        error: 'Audio not found',
        audioId: audioId
      });
    }

    // Check if user has access to premium audio
    if (audio.is_premium === 1) {
      const userSubscription = db.prepare(`
        SELECT status FROM subscriptions
        WHERE user_id = ? AND status = 'active'
      `).get(userId);

      if (!userSubscription) {
        return res.status(403).json({
          error: 'Premium content requires active subscription',
          audioId: audioId
        });
      }
    }

    // Create session in database
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audio_sessions (id, user_id, audio_id, duration_seconds, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, audioId, audio.duration_seconds || 0, now);

    const session = {
      sessionId: sessionId,
      userId: userId,
      audioId: audioId,
      audioTitle: audio.title,
      startedAt: now,
      status: 'active'
    };

    logger.info(`Started session for user ${userId}: ${sessionId} (Audio: ${audio.title})`);

    res.status(201).json({
      success: true,
      message: 'Audio session started',
      session: session
    });
  } catch (error) {
    logger.error('Error starting audio session:', error);
    res.status(500).json({
      error: 'Failed to start audio session',
      message: error.message
    });
  }
});

// ============================================
// END AUDIO SESSION (Requires Authentication)
// ============================================

router.post('/session/end', authMiddleware, (req, res) => {
  try {
    const { sessionId, durationSeconds } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!sessionId || typeof durationSeconds !== 'number') {
      return res.status(400).json({
        error: 'Missing sessionId or durationSeconds'
      });
    }

    // Update session in database
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE audio_sessions
      SET duration_seconds = ?, completed = 1
      WHERE id = ? AND user_id = ?
    `).run(durationSeconds, sessionId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const completedSession = {
      sessionId: sessionId,
      userId: userId,
      durationSeconds: durationSeconds,
      completedAt: now
    };

    console.log(`Ended session for user ${userId}: ${sessionId}`);

    res.json({
      success: true,
      message: 'Audio session ended',
      session: completedSession
    });
  } catch (error) {
    logger.error('Error ending audio session:', error);
    res.status(500).json({
      error: 'Failed to end audio session',
      message: error.message
    });
  }
});

// ============================================
// GET USER STATS (Requires Authentication)
// ============================================

router.get('/user/stats', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user's sessions from database
    const sessions = db.prepare('SELECT * FROM audio_sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    // Calculate stats
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) / 60;
    const completedSessions = sessions.filter(s => s.completed).length;
    const lastSessionAt = sessions.length > 0 ? sessions[0].created_at : null;

    const stats = {
      userId: userId,
      totalSessions: totalSessions,
      completedSessions: completedSessions,
      totalMinutes: Math.round(totalMinutes),
      lastSessionAt: lastSessionAt,
      sessions: sessions
    };

    logger.info(`User stats fetched for ${userId}: ${totalSessions} sessions, ${Math.round(totalMinutes)} minutes`);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
});

// ============================================
// GET USER ACHIEVEMENTS (Requires Authentication)
// ============================================

router.get('/user/achievements', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user's sessions from database
    const sessions = db.prepare('SELECT * FROM audio_sessions WHERE user_id = ? AND completed = 1').all(userId);
    const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) / 60;

    // Define achievements
    const achievements = [];

    if (sessions.length >= 1) {
      // Check if achievement already exists
      const existing = db.prepare('SELECT id FROM achievements WHERE user_id = ? AND achievement_type = ?').get(userId, 'first-session');
      if (!existing) {
        const achievementId = uuidv4();
        db.prepare(`
          INSERT INTO achievements (id, user_id, achievement_type, title, description, earned_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(achievementId, userId, 'first-session', 'Getting Started', 'Complete your first audio session', new Date().toISOString());
      }
      achievements.push({
        id: 'first-session',
        name: 'Getting Started',
        description: 'Complete your first audio session',
        unlockedAt: sessions[0]?.created_at,
        icon: '🎯'
      });
    }

    if (sessions.length >= 5) {
      const existing = db.prepare('SELECT id FROM achievements WHERE user_id = ? AND achievement_type = ?').get(userId, 'session-streak');
      if (!existing) {
        const achievementId = uuidv4();
        db.prepare(`
          INSERT INTO achievements (id, user_id, achievement_type, title, description, earned_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(achievementId, userId, 'session-streak', 'On a Roll', 'Complete 5 sessions', new Date().toISOString());
      }
      achievements.push({
        id: 'session-streak',
        name: 'On a Roll',
        description: 'Complete 5 sessions',
        unlockedAt: sessions[4]?.created_at,
        icon: '🔥'
      });
    }

    if (totalMinutes >= 60) {
      const existing = db.prepare('SELECT id FROM achievements WHERE user_id = ? AND achievement_type = ?').get(userId, 'hour-meditation');
      if (!existing) {
        const achievementId = uuidv4();
        db.prepare(`
          INSERT INTO achievements (id, user_id, achievement_type, title, description, earned_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(achievementId, userId, 'hour-meditation', 'Mindful Hour', 'Meditate for 60 minutes total', new Date().toISOString());
      }
      achievements.push({
        id: 'hour-meditation',
        name: 'Mindful Hour',
        description: 'Meditate for 60 minutes total',
        unlockedAt: new Date().toISOString(),
        icon: '⏱️'
      });
    }

    if (totalMinutes >= 300) {
      const existing = db.prepare('SELECT id FROM achievements WHERE user_id = ? AND achievement_type = ?').get(userId, 'five-hour-meditation');
      if (!existing) {
        const achievementId = uuidv4();
        db.prepare(`
          INSERT INTO achievements (id, user_id, achievement_type, title, description, earned_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(achievementId, userId, 'five-hour-meditation', 'Zen Master', 'Meditate for 300 minutes total', new Date().toISOString());
      }
      achievements.push({
        id: 'five-hour-meditation',
        name: 'Zen Master',
        description: 'Meditate for 300 minutes total',
        unlockedAt: new Date().toISOString(),
        icon: '🧘'
      });
    }

    res.json({
      success: true,
      achievements: achievements,
      totalAchievements: achievements.length
    });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements',
      message: error.message
    });
  }
});

export default router;