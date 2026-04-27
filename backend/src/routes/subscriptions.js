import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';
import paystackService from '../services/paystack.js';
import logger from '../utils/logger.js';

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
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user ID found in token'
      });
    }

    // ALL USERS GET FULL ACCESS - Return premium features for all registered users
    res.json({
      success: true,
      subscription: {
        userId: userId,
        plan: 'premium', // Everyone gets premium features
        planType: 'premium',
        status: 'active',
        isPremium: true,
        createdAt: new Date(),
        expiresAt: null, // Never expires
        features: {
          unlimitedQuotes: true,
          unlimitedAudio: true,
          offlineAccess: true,
          adFree: true,
          allSolfeggios: true,
          allNatureSounds: true
        }
      }
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
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user already has a subscription
    const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
    if (existingSub) {
      return res.status(409).json({ error: 'User already has a subscription' });
    }

    // Create free subscription
    const subId = uuidv4();
    const now = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 5 years

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_type, status, current_period_end, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(subId, userId, 'free', 'active', expiryDate, now, now);

    // Update user subscription type
    db.prepare('UPDATE users SET subscription_type = ? WHERE id = ?').run('free', userId);

    const subscription = {
      id: subId,
      userId: userId,
      plan: 'free',
      status: 'active',
      activatedAt: now,
      expiresAt: expiryDate
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
// UPGRADE TO PREMIUM (Disabled - All Users Have Premium)
// ============================================

router.post('/upgrade-to-premium', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // FEATURE DISABLED - All users already have premium access
    // Just return success message
    res.json({
      success: true,
      message: 'All features are already unlocked for your account!',
      subscription: {
        userId: userId,
        plan: 'premium',
        status: 'active',
        isPremium: true
      }
    });

    if (!paymentResult.success) {
      logger.error('Paystack payment initialization failed', {
        userId,
        error: paymentResult.error
      });

      return res.status(500).json({
        error: 'Payment initialization failed',
        message: paymentResult.error
      });
    }

    logger.info('Premium upgrade payment initialized', {
      userId,
      reference,
      paystackRef: paymentResult.data.reference
    });

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      payment: {
        reference: paymentResult.data.reference,
        authorization_url: paymentResult.data.authorization_url,
        amount: amount / 100, // Convert back to Naira for display
        currency: 'NGN'
      }
    });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    logger.error('Premium upgrade failed', {
      userId: req.user?.userId,
      error: error.message
    });

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
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Update subscription to free
    const now = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 5 years

    db.prepare(`
      UPDATE subscriptions
      SET plan_type = ?, status = ?, current_period_end = ?, updated_at = ?
      WHERE user_id = ?
    `).run('free', 'active', expiryDate, now, userId);

    // Update user subscription type
    db.prepare('UPDATE users SET subscription_type = ? WHERE id = ?').run('free', userId);

    const subscription = {
      userId: userId,
      plan: 'free',
      status: 'active',
      downgradedAt: now
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

// ============================================
// PAYSTACK WEBHOOK - Handle Payment Confirmations
// ============================================

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    // Paystack sends webhook data in raw body
    const event = JSON.parse(req.body);

    logger.info('Paystack webhook received', {
      event: event.event,
      reference: event.data?.reference
    });

    if (event.event === 'charge.success') {
      const { reference, customer, amount } = event.data;
      const metadata = event.data.metadata || {};

      // Extract user ID from reference or metadata
      const userId = metadata.userId || reference.split('_')[1];

      if (userId) {
        // Update subscription in database
        const now = new Date().toISOString();
        const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

        const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
        if (existingSub) {
          db.prepare(`
            UPDATE subscriptions
            SET plan_type = ?, status = ?, current_period_end = ?, paystack_subscription_id = ?, updated_at = ?
            WHERE user_id = ?
          `).run('premium', 'active', expiryDate, reference, now, userId);
        } else {
          const subId = uuidv4();
          db.prepare(`
            INSERT INTO subscriptions (id, user_id, plan_type, status, current_period_end, paystack_subscription_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(subId, userId, 'premium', 'active', expiryDate, reference, now, now);
        }

        // Update user subscription type
        db.prepare('UPDATE users SET subscription_type = ? WHERE id = ?').run('premium', userId);

        logger.info('Subscription upgraded via webhook', {
          userId,
          reference,
          amount: amount / 100 // Convert from kobo to Naira
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error.message,
      body: req.body
    });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;