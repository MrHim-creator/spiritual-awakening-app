#!/usr/bin/env node

/**
 * Admin Setup Script
 * Run this to create your first admin user
 *
 * Usage: node setup-admin.js
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import readline from 'readline';
import db from './src/models/database.js';
import logger from './src/utils/logger.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log('🚀 Spiritual Awakening App - Admin Setup\n');

    // Get user input
    const email = await askQuestion('Enter admin email: ');
    const username = await askQuestion('Enter admin username: ');
    const password = await askQuestion('Enter admin password: ');

    if (!email || !username || !password) {
      console.log('❌ All fields are required');
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, is_admin, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(userId, email, username, hashedPassword, now, now);

    console.log('\n✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 User ID: ${userId}`);

    // Generate a test token for immediate login
    const token = jwt.sign(
      { userId, email, username, is_admin: 1 },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('\n🔐 Test Token (valid for 24 hours):');
    console.log(token);
    console.log('\n💡 Use this token to test admin endpoints or login to the admin dashboard');

    rl.close();

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdminUser();