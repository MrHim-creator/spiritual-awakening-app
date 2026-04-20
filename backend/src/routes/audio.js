import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// In-memory storage (replace with database later)
const audioLibrary = [
  {
    id: '1',
    type: 'meditation',
    title: '10-Minute Breathing Meditation',
    duration: 600,
    category: 'Breathing',
    description: 'Calm your mind with this simple breathing exercise'
  },
  {
    id: '2',
    type: 'meditation',
    title: '20-Minute Body Scan',
    duration: 1200,
    category: 'Body Scan',
    description: 'Relax your body from head to toe'
  },
  {
    id: '3',
    type: 'frequency',
    title: '174 Hz - Pain Relief',
    duration: 3600,
    category: 'Healing',
    description: 'Binaural beats for pain relief'
  },
  {
    id: '4',
    type: 'frequency',
    title: '528 Hz - Love Frequency',
    duration: 3600,
    category: 'Healing',
    description: 'Healing frequency for love and peace'
  }
];

// In-memory user sessions (replace with database later)
const userSessions = {};

// ============================================
// GET AUDIO LIBRARY (Public)
// ============================================

router.get('/', optionalAuthMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      audioLibrary: audioLibrary
    });
  } catch (error) {
    console.error('Error fetching audio library:', error);
    res.status(500).json({
      error: 'Failed to fetch audio library',
      message: error.message
    });
  }
});

// ============================================
// GET AUDIO BY TYPE AND ID (Public)
// ============================================

router.get('/:audioType/:audioId', optionalAuthMiddleware, (req, res) => {
  try {
    const { audioType, audioId } = req.params;

    if (!audioType || !audioId) {
      return res.status(400).json({
        error: 'Missing audioType or audioId'
      });
    }

    const audio = audioLibrary.find(
      a => a.type === audioType && a.id === audioId
    );

    if (!audio) {
      return res.status(404).json({
        error: 'Audio not found',
        audioType: audioType,
        audioId: audioId
      });
    }

    res.json({
      success: true,
      audio: audio
    });
  } catch (error) {
    console.error('Error fetching audio:', error);
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
    const { audioType, audioId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!audioType || !audioId) {
      return res.status(400).json({
        error: 'Missing audioType or audioId',
        required: ['audioType', 'audioId']
      });
    }

    // Find the audio
    const audio = audioLibrary.find(
      a => a.type === audioType && a.id === audioId
    );

    if (!audio) {
      return res.status(404).json({
        error: 'Audio not found'
      });
    }

    // Create session
    const sessionId = uuidv4();
    const session = {
      sessionId: sessionId,
      userId: userId,
      audioType: audioType,
      audioId: audioId,
      audioTitle: audio.title,
      startedAt: new Date(),
      status: 'active'
    };

    // Store session (in-memory for now)
    if (!userSessions[userId]) {
      userSessions[userId] = [];
    }
    userSessions[userId].push(session);

    console.log(`Started session for user ${userId}: ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Audio session started',
      session: session
    });
  } catch (error) {
    console.error('Error starting audio session:', error);
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
    const userId = req.user?.id;

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

    // TODO: Update database
    const completedSession = {
      sessionId: sessionId,
      userId: userId,
      durationSeconds: durationSeconds,
      completedAt: new Date()
    };

    console.log(`Ended session for user ${userId}: ${sessionId}`);

    res.json({
      success: true,
      message: 'Audio session ended',
      session: completedSession
    });
  } catch (error) {
    console.error('Error ending audio session:', error);
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user's sessions
    const userSessionsList = userSessions[userId] || [];

    // Calculate stats
    const totalSessions = userSessionsList.length;
    const totalMinutes = userSessionsList.reduce((sum, session) => {
      // Estimate based on audio duration if session data available
      return sum + 10; // Default 10 minutes per session for now
    }, 0);

    const stats = {
      userId: userId,
      totalSessions: totalSessions,
      totalMinutes: totalMinutes,
      lastSessionAt: userSessionsList.length > 0 
        ? userSessionsList[userSessionsList.length - 1].startedAt 
        : null,
      sessions: userSessionsList
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user's stats
    const userSessionsList = userSessions[userId] || [];
    const totalMinutes = userSessionsList.length * 10; // Estimate

    // Define achievements
    const achievements = [];

    if (userSessionsList.length >= 1) {
      achievements.push({
        id: 'first-session',
        name: 'Getting Started',
        description: 'Complete your first audio session',
        unlockedAt: userSessionsList[0]?.startedAt,
        icon: '🎯'
      });
    }

    if (userSessionsList.length >= 5) {
      achievements.push({
        id: 'session-streak',
        name: 'On a Roll',
        description: 'Complete 5 sessions',
        unlockedAt: userSessionsList[4]?.startedAt,
        icon: '🔥'
      });
    }

    if (totalMinutes >= 60) {
      achievements.push({
        id: 'hour-meditation',
        name: 'Mindful Hour',
        description: 'Meditate for 60 minutes total',
        unlockedAt: new Date(),
        icon: '⏱️'
      });
    }

    if (totalMinutes >= 300) {
      achievements.push({
        id: 'five-hour-meditation',
        name: 'Zen Master',
        description: 'Meditate for 300 minutes total',
        unlockedAt: new Date(),
        icon: '🧘'
      });
    }

    res.json({
      success: true,
      achievements: achievements,
      totalAchievements: achievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements',
      message: error.message
    });
  }
});

export default router;