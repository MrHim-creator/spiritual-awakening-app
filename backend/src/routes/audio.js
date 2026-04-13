import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Audio library - Solfeggio frequencies and nature sounds
const AUDIO_LIBRARY = {
  solfeggio: [
    { id: '174hz', name: '174 Hz - Deep Sleep', frequency: '174Hz', description: 'Pain relief and healing' },
    { id: '285hz', name: '285 Hz - Regeneration', frequency: '285Hz', description: 'Cell regeneration' },
    { id: '396hz', name: '396 Hz - Liberation', frequency: '396Hz', description: 'Release from guilt and fear' },
    { id: '417hz', name: '417 Hz - Transformation', frequency: '417Hz', description: 'Facilitating change' },
    { id: '528hz', name: '528 Hz - Love & Miracles', frequency: '528Hz', description: 'DNA repair and healing' },
    { id: '639hz', name: '639 Hz - Connection', frequency: '639Hz', description: 'Relationships and harmony' },
    { id: '741hz', name: '741 Hz - Intuition', frequency: '741Hz', description: 'Awaken inner strength' },
    { id: '852hz', name: '852 Hz - Awakening', frequency: '852Hz', description: 'Spiritual enlightenment' }
  ],
  nature: [
    { id: 'rain', name: 'Peaceful Rain', type: 'rain', description: 'Calming rain sounds' },
    { id: 'ocean', name: 'Ocean Waves', type: 'ocean', description: 'Relaxing ocean waves' },
    { id: 'forest', name: 'Forest Birds', type: 'forest', description: 'Forest ambience' },
    { id: 'thunder', name: 'Thunder Storm', type: 'thunder', description: 'Dramatic thunderstorm' },
    { id: 'river', name: 'Flowing River', type: 'river', description: 'Peaceful river sounds' },
    { id: 'meditation', name: 'Meditation Bell', type: 'meditation', description: 'Tibetan singing bowl' }
  ]
};

/**
 * GET /api/audio
 * Get all audio library
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      audio: AUDIO_LIBRARY
    });
  } catch (error) {
    console.error('Error fetching audio library:', error);
    res.status(500).json({ error: 'Failed to fetch audio library' });
  }
});

/**
 * GET /api/audio/:audioType/:audioId
 * Get specific audio
 */
router.get('/:audioType/:audioId', (req, res) => {
  try {
    const { audioType, audioId } = req.params;
    
    let audio = null;
    if (audioType === 'solfeggio') {
      audio = AUDIO_LIBRARY.solfeggio.find(a => a.id === audioId);
    } else if (audioType === 'nature') {
      audio = AUDIO_LIBRARY.nature.find(a => a.id === audioId);
    }

    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    res.json({
      success: true,
      audio
    });
  } catch (error) {
    console.error('Error fetching audio:', error);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
});

/**
 * POST /api/audio/session/start
 * Start meditation session
 */
router.post('/session/start', authMiddleware, (req, res) => {
  try {
    const { audioType, audioId } = req.body;
    const userId = req.user.userId;

    if (!audioType || !audioId) {
      return res.status(400).json({ error: 'audioType and audioId required' });
    }

    const sessionId = uuidv4();
    
    db.prepare(`
      INSERT INTO audio_sessions (id, user_id, audio_type, audio_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, audioType, audioId, new Date().toISOString());

    res.json({
      success: true,
      sessionId,
      message: 'Meditation session started'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /api/audio/session/end
 * End meditation session
 */
router.post('/session/end', authMiddleware, (req, res) => {
  try {
    const { sessionId, durationSeconds } = req.body;
    const userId = req.user.userId;

    if (!sessionId || !durationSeconds) {
      return res.status(400).json({ error: 'sessionId and durationSeconds required' });
    }

    db.prepare(`
      UPDATE audio_sessions
      SET duration_seconds = ?, completed = 1
      WHERE id = ? AND user_id = ?
    `).run(durationSeconds, sessionId, userId);

    res.json({
      success: true,
      message: 'Session ended',
      duration: durationSeconds
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * GET /api/audio/user/stats
 * Get user's audio stats
 */
router.get('/user/stats', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalSessions,
        SUM(duration_seconds) as totalMinutes,
        AVG(duration_seconds) as avgDuration,
        MAX(created_at) as lastSession
      FROM audio_sessions
      WHERE user_id = ? AND completed = 1
    `).get(userId);

    const byType = db.prepare(`
      SELECT audio_type, COUNT(*) as count, SUM(duration_seconds) as duration
      FROM audio_sessions
      WHERE user_id = ? AND completed = 1
      GROUP BY audio_type
    `).all(userId);

    res.json({
      success: true,
      stats: {
        totalSessions: stats.totalSessions || 0,
        totalMinutes: Math.floor((stats.totalMinutes || 0) / 60),
        avgDuration: Math.floor(stats.avgDuration || 0),
        lastSession: stats.lastSession,
        byType
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/audio/user/achievements
 * Get user's achievements
 */
router.get('/user/achievements', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;

    const achievements = db.prepare(`
      SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC
    `).all(userId);

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;