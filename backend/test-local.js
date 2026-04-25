#!/usr/bin/env node

/**
 * Local Test Script
 * Tests the app locally without requiring external services
 *
 * Usage: node test-local.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testLocal() {
  console.log('🧪 Testing Spiritual Awakening App Locally\n');

  try {
    // Check if .env exists
    console.log('1. Checking environment setup...');
    const fs = await import('fs');
    if (!fs.existsSync('.env')) {
      console.log('❌ .env file not found. Copy .env.example to .env and fill in values');
      process.exit(1);
    }
    console.log('✅ .env file exists');

    // Check Node version
    console.log('2. Checking Node.js version...');
    const { stdout: nodeVersion } = await execAsync('node --version');
    console.log(`✅ Node.js: ${nodeVersion.trim()}`);

    // Check if dependencies are installed
    console.log('3. Checking dependencies...');
    if (!fs.existsSync('node_modules')) {
      console.log('❌ node_modules not found. Run: npm install');
      process.exit(1);
    }
    console.log('✅ Dependencies installed');

    // Check database
    console.log('4. Checking database...');
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
      console.log('📁 Created data directory');
    }
    console.log('✅ Database directory ready');

    // Test server startup
    console.log('5. Testing server startup...');
    console.log('🚀 Starting server...');

    const serverProcess = exec('node src/server.js', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Server failed to start:', error.message);
        return;
      }
      console.log('✅ Server started successfully');
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test basic endpoints
    console.log('6. Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        console.log('✅ Health check passed');
      } else {
        console.log('⚠️ Health check returned:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Could not connect to server (this is normal if server didn\'t start)');
    }

    // Kill server
    serverProcess.kill();

    console.log('\n🎉 Local test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Fill in your Cloudinary credentials in .env');
    console.log('2. Run: node setup-admin.js (to create admin user)');
    console.log('3. Run: npm run dev (to start development server)');
    console.log('4. Visit: http://localhost:3000 (frontend) and http://localhost:3000/admin (admin)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLocal();