import axios from 'axios';
import logger from '../utils/logger.js';

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Validate configuration
if (!PAYSTACK_SECRET_KEY) {
  logger.warn('PAYSTACK_SECRET_KEY not set - payments will not work');
}

class PaystackService {
  constructor() {
    this.client = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Initialize a payment transaction
   * @param {Object} data - Payment data
   * @param {string} data.email - Customer email
   * @param {number} data.amount - Amount in kobo (multiply Naira by 100)
   * @param {string} data.reference - Unique reference
   * @param {string} data.callback_url - Callback URL
   * @param {Object} data.metadata - Additional metadata
   */
  async initializeTransaction(data) {
    try {
      logger.info('Initializing Paystack transaction', {
        email: data.email,
        amount: data.amount,
        reference: data.reference
      });

      const response = await this.client.post('/transaction/initialize', {
        email: data.email,
        amount: data.amount, // Amount in kobo
        reference: data.reference,
        callback_url: data.callback_url,
        metadata: data.metadata || {}
      });

      logger.info('Paystack transaction initialized', {
        reference: data.reference,
        paystackRef: response.data.data.reference
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Paystack transaction initialization failed', {
        error: error.message,
        reference: data.reference
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} reference - Transaction reference
   */
  async verifyTransaction(reference) {
    try {
      logger.info('Verifying Paystack transaction', { reference });

      const response = await this.client.get(`/transaction/verify/${reference}`);

      const transaction = response.data.data;

      logger.info('Paystack transaction verified', {
        reference,
        status: transaction.status,
        amount: transaction.amount
      });

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      logger.error('Paystack transaction verification failed', {
        error: error.message,
        reference
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a payment plan (subscription plan)
   * @param {Object} data - Plan data
   */
  async createPlan(data) {
    try {
      logger.info('Creating Paystack plan', { name: data.name });

      const response = await this.client.post('/plan', {
        name: data.name,
        amount: data.amount, // Amount in kobo
        interval: data.interval, // daily, weekly, monthly, yearly
        description: data.description
      });

      logger.info('Paystack plan created', {
        planId: response.data.data.id,
        name: data.name
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Paystack plan creation failed', {
        error: error.message,
        name: data.name
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Initialize subscription
   * @param {Object} data - Subscription data
   */
  async initializeSubscription(data) {
    try {
      logger.info('Initializing Paystack subscription', {
        email: data.email,
        plan: data.plan
      });

      const response = await this.client.post('/subscription', {
        customer: data.customer,
        plan: data.plan,
        start_date: data.start_date
      });

      logger.info('Paystack subscription initialized', {
        subscriptionId: response.data.data.id
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Paystack subscription initialization failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get transaction details
   * @param {string} id - Transaction ID
   */
  async getTransaction(id) {
    try {
      const response = await this.client.get(`/transaction/${id}`);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Failed to get Paystack transaction', {
        error: error.message,
        id
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

const paystackService = new PaystackService();
export default paystackService;