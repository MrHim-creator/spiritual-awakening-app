import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/subscriptions/plans
 * Get all subscription plans
 */
router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      plans: [
        {
          id: 'free',
          name: 'Free Plan',
          price: 'R0',
          billingCycle: 'forever',
          features: [
            'Access to free quotes',
            'Basic nature sounds (3)',
            'Limited Solfeggio (3 frequencies)',
            'Save up to 5 favorites',
            'Basic meditation tracking',
            'See ads'
          ]
        },
        {
          id: 'premium',
          name: 'Premium Plan (Free while building)',
          price: 'R0',
          billingCycle: 'lifetime',
          savingsBadge: 'FREE DURING DEVELOPMENT',
          features: [
            'All quotes (25+)',
            'All 8 Solfeggio frequencies',
            'All nature sounds (6)',
            'Unlimited favorites',
            'Full meditation tracking',
            'No ads',
            'Download for offline',
            'Priority features'
          ]
        }
      ],
      message: 'Both plans are FREE while you build your app.'
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/subscriptions/activate-free
 * Activate free plan for user
 */
router.post('/activate-free', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
    
    if (existingSub) {
      return res.status(200).json({ 
        success: true,
        message: 'You already have a subscription'
      });
    }

    const subscriptionId = uuidv4();
    const fiveYearsFromNow = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, stripe_subscription_id, plan_type, 
        status, current_period_end, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      subscriptionId,
      userId,
      'free-' + uuidv4(),
      'free',
      'active',
      fiveYearsFromNow.toISOString(),
      new Date().toISOString()
    );

    db.prepare(`
      UPDATE users 
      SET subscription_type = 'free', subscription_end_date = ?
      WHERE id = ?
    `).run(fiveYearsFromNow.toISOString(), userId);

    res.json({
      success: true,
      message: 'Free subscription activated!'
    });
  } catch (error) {
    console.error('Error activating free plan:', error);
    res.status(500).json({ error: 'Failed to activate free plan' });
  }
});

/**
 * POST /api/subscriptions/upgrade-to-premium
 * Upgrade to premium (FREE during development)
 */
router.post('/upgrade-to-premium', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription_type === 'premium') {
      return res.status(409).json({ error: 'You already have premium' });
    }

    let subscription = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
    
    const tenYearsFromNow = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

    if (subscription) {
      db.prepare(`
        UPDATE subscriptions
        SET plan_type = 'premium',
            status = 'active',
            current_period_end = ?
        WHERE user_id = ?
      `).run(tenYearsFromNow.toISOString(), userId);
    } else {
      const subscriptionId = uuidv4();
      db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, stripe_subscription_id, plan_type,
          status, current_period_end, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        subscriptionId,
        userId,
        'premium-free-' + uuidv4(),
        'premium',
        'active',
        tenYearsFromNow.toISOString(),
        new Date().toISOString()
      );
    }

    db.prepare(`
      UPDATE users
      SET subscription_type = 'premium', subscription_end_date = ?
      WHERE id = ?
    `).run(tenYearsFromNow.toISOString(), userId);

    res.json({
      success: true,
      message: 'Premium activated! (R0 during development)'
    });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    res.status(500).json({ error: 'Failed to upgrade to premium' });
  }
});

/**
 * GET /api/subscriptions/status
 * Get current user's subscription status
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);

    res.json({
      success: true,
      subscriptionType: user.subscription_type || 'none',
      isPremium: user.subscription_type === 'premium',
      subscription: subscription ? {
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      } : null
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/subscriptions/downgrade-to-free
 * Downgrade from premium back to free
 */
router.post('/downgrade-to-free', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    if (subscription.plan_type === 'free') {
      return res.status(400).json({ error: 'You already have free plan' });
    }

    const fiveYearsFromNow = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

    db.prepare(`
      UPDATE subscriptions
      SET plan_type = 'free',
          current_period_end = ?
      WHERE user_id = ?
    `).run(fiveYearsFromNow.toISOString(), userId);

    db.prepare(`
      UPDATE users
      SET subscription_type = 'free'
      WHERE id = ?
    `).run(userId);

    res.json({
      success: true,
      message: 'Downgraded to free plan'
    });
  } catch (error) {
    console.error('Downgrade error:', error);
    res.status(500).json({ error: 'Failed to downgrade' });
  }
});

export default router;