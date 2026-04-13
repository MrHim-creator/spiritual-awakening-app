import Joi from 'joi';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const schemas = {
  // Auth validation
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // Quote validation
  quoteQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string(),
    search: Joi.string().max(100)
  }),

  // Subscription validation
  subscription: Joi.object({
    planId: Joi.string().required()
  }),

  // Audio session validation
  audioSession: Joi.object({
    audioType: Joi.string().required(),
    audioId: Joi.string().required(),
    durationSeconds: Joi.number().integer().min(0)
  })
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * Validate request body against schema
 */
export const validate = (schemaName) => {
  return (req, res, next) => {
    if (!schemas[schemaName]) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schemas[schemaName].validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: messages
      });
    }

    req.validatedData = value;
    next();
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schemaName) => {
  return (req, res, next) => {
    if (!schemas[schemaName]) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schemas[schemaName].validate(req.query, {
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: messages
      });
    }

    req.validatedQuery = value;
    next();
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Limit length
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get pagination parameters with defaults
 */
export const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export default {
  schemas,
  validate,
  validateQuery,
  sanitizeString,
  isValidEmail,
  getPaginationParams
};