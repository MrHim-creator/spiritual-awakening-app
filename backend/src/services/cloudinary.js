/**
 * Cloudinary Integration for Audio File Hosting
 * 
 * Setup Instructions:
 * 1. Create free account: https://cloudinary.com/users/register/free
 * 2. Get credentials from: https://cloudinary.com/console
 * 3. Add to .env:
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    CLOUDINARY_API_KEY=your_api_key
 *    CLOUDINARY_API_SECRET=your_api_secret
 * 4. Update audio URLs in database with actual hosted URLs
 * 
 * Free Tier Limits:
 * - 25 GB storage
 * - 25 GB bandwidth/month
 * - Unlimited requests
 * - Perfect for app with <1000 daily users
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import logger from './logger.js';

const CLOUDINARY_BASE = 'https://api.cloudinary.com/v1_1';

/**
 * Initialize Cloudinary client
 */
const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('Cloudinary credentials not configured. Media uploads disabled.');
    return null;
  }

  return { cloudName, apiKey, apiSecret };
};

/**
 * Upload audio file to Cloudinary
 * @param {string} filePath - Local path to audio file
 * @param {string} fileName - Name for the audio file
 * @returns {object} - Upload result with URL
 */
export const uploadAudioToCloudinary = async (filePath, fileName) => {
  try {
    const config = getCloudinaryConfig();
    if (!config) {
      throw new Error('Cloudinary is not configured');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('upload_preset', 'spiritual_awakening_audio'); // You need to create this preset
    form.append('public_id', fileName);
    form.append('resource_type', 'auto');

    logger.info(`Uploading audio to Cloudinary: ${fileName}`);

    const response = await axios.post(
      `${CLOUDINARY_BASE}/${config.cloudName}/upload`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000 // 60 seconds for large files
      }
    );

    const result = {
      success: true,
      fileName: fileName,
      publicId: response.data.public_id,
      url: response.data.url,
      secureUrl: response.data.secure_url,
      size: response.data.bytes,
      duration: response.data.duration || null
    };

    logger.info(`Audio uploaded successfully: ${fileName}`);
    return result;
  } catch (error) {
    logger.error('Error uploading audio to Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate optimized audio URL for streaming
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Optimization options
 */
export const getOptimizedAudioUrl = (publicId, options = {}) => {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const {
    quality = 'auto', // auto, high, low
    format = 'mp3', // mp3, m4a, ogg, wav
    bitrate = '128k' // 64k, 128k, 192k, 256k
  } = options;

  const url = `https://res.cloudinary.com/${config.cloudName}/video/upload/` +
    `q_${quality},` +
    `br_${bitrate},` +
    `f_${format}/` +
    `${publicId}`;

  return url;
};

/**
 * Delete audio from Cloudinary
 */
export const deleteAudioFromCloudinary = async (publicId) => {
  try {
    const config = getCloudinaryConfig();
    if (!config) {
      throw new Error('Cloudinary is not configured');
    }

    const signature = generateSignature(config.apiSecret);

    const response = await axios.post(
      `${CLOUDINARY_BASE}/${config.cloudName}/destroy`,
      {
        public_id: publicId,
        api_key: config.apiKey,
        signature: signature,
        timestamp: Math.floor(Date.now() / 1000)
      }
    );

    logger.info(`Audio deleted from Cloudinary: ${publicId}`);
    return response.data;
  } catch (error) {
    logger.error('Error deleting audio from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get audio metadata from Cloudinary
 */
export const getAudioMetadata = async (publicId) => {
  try {
    const config = getCloudinaryConfig();
    if (!config) {
      throw new Error('Cloudinary is not configured');
    }

    const response = await axios.get(
      `${CLOUDINARY_BASE}/${config.cloudName}/resources/video/${publicId}`,
      {
        params: {
          api_key: config.apiKey
        }
      }
    );

    return {
      publicId: response.data.public_id,
      url: response.data.url,
      size: response.data.bytes,
      duration: response.data.duration,
      format: response.data.format,
      createdAt: response.data.created_at
    };
  } catch (error) {
    logger.error('Error fetching audio metadata:', error);
    throw error;
  }
};

/**
 * Generate signature for API requests
 */
const generateSignature = (apiSecret) => {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const str = `timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash('sha1').update(str).digest('hex');
};

export default {
  uploadAudioToCloudinary,
  getOptimizedAudioUrl,
  deleteAudioFromCloudinary,
  getAudioMetadata
};
