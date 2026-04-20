import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// SUBSCRIPTION PLANS (Public - No Auth Required)
// ============================================

router.get('/plans', (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        features: [
          'Limited quotes',
          'Basic meditations',
          '3 audio sessions per day'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 9.99,
        features: [
          'Unlimited quotes',
          'All meditations',
          'Unlimited audio sessions',
          'Ad-free experience',
          'Offline access'
        ]
      }
    ];

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      error: 'Failed to fetch plans',
      message: error.message
    });
  }
});

// ============================================
// GET SUBSCRIPTION STATUS (Requires Authentication)
// ============================================

router.get('/status', authMiddleware, (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user ID found in token'
      });
    }

    // TODO: Fetch from database
    // For now, return dummy data
    const subscription = {
      userId: userId,
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      expiresAt: null, // Free plan doesn't expire
      features: {
        unlimitedQuotes: false,
        unlimitedAudio: false,
        offlineAccess: false,
        adFree: false
      }
    };

    res.json({
      success: true,
      subscription: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription status',
      message: error.message
    });
  }
});

// ============================================
// ACTIVATE FREE SUBSCRIPTION (Requires Authentication)
// ============================================

router.post('/activate-free', authMiddleware, (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // TODO: Save to database
    const subscription = {
      userId: userId,
      plan: 'free',
      status: 'active',
      activatedAt: new Date()
    };

    console.log(`Activated free subscription for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Free subscription activated',
      subscription: subscription
    });
  } catch (error) {
    console.error('Error activating free subscription:', error);
    res.status(500).json({
      error: 'Failed to activate free subscription',
      message: error.message
    });
  }
});

// ============================================
// UPGRADE TO PREMIUM (Requires Authentication)
// ============================================

router.post('/upgrade-to-premium', authMiddleware, (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // TODO: Process payment with Stripe or similar
    // For now, just update the subscription
    const subscription = {
      userId: userId,
      plan: 'premium',
      status: 'active',
      upgradedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    console.log(`Upgraded user to premium: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Upgraded to premium subscription',
      subscription: subscription
    });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    res.status(500).json({
      error: 'Failed to upgrade to premium',
      message: error.message
    });
  }
});

// ============================================
// DOWNGRADE TO FREE (Requires Authentication)
// ============================================

router.post('/downgrade-to-free', authMiddleware, (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // TODO: Update database
    const subscription = {
      userId: userId,
      plan: 'free',
      status: 'active',
      downgradedAt: new Date()
    };

    console.log(`Downgraded user to free: ${userId}`);

    res.json({
      success: true,
      message: 'Downgraded to free subscription',
      subscription: subscription
    });
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({
      error: 'Failed to downgrade subscription',
      message: error.message
    });
  }
});

export default router;