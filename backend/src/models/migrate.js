import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migration script to move data from SQLite to PostgreSQL
 * Run this script once when deploying to production
 */

async function migrateToPostgreSQL() {
  console.log('🚀 Starting database migration from SQLite to PostgreSQL...');

  // Connect to SQLite (source)
  const sqlitePath = path.join(__dirname, '../data/app.db');
  const sqliteDb = new Database(sqlitePath);
  console.log('✓ Connected to SQLite database');

  // Connect to PostgreSQL (target)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log('✓ Connected to PostgreSQL database');

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Migrate users
    console.log('📋 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, username, password_hash, bio, is_admin, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.username, user.password_hash, user.bio, user.is_admin, user.created_at, user.updated_at]);
    }
    console.log(`✓ Migrated ${users.length} users`);

    // Migrate quotes
    console.log('📋 Migrating quotes...');
    const quotes = sqliteDb.prepare('SELECT * FROM quotes').all();
    for (const quote of quotes) {
      await client.query(`
        INSERT INTO quotes (id, text, author, category, source, views, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [quote.id, quote.text, quote.author, quote.category, quote.source, quote.views, quote.created_at]);
    }
    console.log(`✓ Migrated ${quotes.length} quotes`);

    // Migrate user favorites
    console.log('📋 Migrating user favorites...');
    const favorites = sqliteDb.prepare('SELECT * FROM user_favorites').all();
    for (const fav of favorites) {
      await client.query(`
        INSERT INTO user_favorites (user_id, quote_id, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, quote_id) DO NOTHING
      `, [fav.user_id, fav.quote_id, fav.created_at]);
    }
    console.log(`✓ Migrated ${favorites.length} user favorites`);

    // Migrate audio files
    console.log('📋 Migrating audio files...');
    const audioFiles = sqliteDb.prepare('SELECT * FROM audio_files').all();
    for (const audio of audioFiles) {
      await client.query(`
        INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, plays, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [audio.id, audio.title, audio.description, audio.file_url, audio.duration_seconds, audio.category, audio.plays, audio.created_at, audio.updated_at]);
    }
    console.log(`✓ Migrated ${audioFiles.length} audio files`);

    // Migrate audio sessions
    console.log('📋 Migrating audio sessions...');
    const sessions = sqliteDb.prepare('SELECT * FROM audio_sessions').all();
    for (const session of sessions) {
      await client.query(`
        INSERT INTO audio_sessions (id, user_id, audio_type, audio_id, duration_seconds, completed, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [session.id, session.user_id, session.audio_type, session.audio_id, session.duration_seconds, session.completed, session.created_at]);
    }
    console.log(`✓ Migrated ${sessions.length} audio sessions`);

    // Migrate achievements
    console.log('📋 Migrating achievements...');
    const achievements = sqliteDb.prepare('SELECT * FROM achievements').all();
    for (const achievement of achievements) {
      await client.query(`
        INSERT INTO achievements (id, user_id, achievement_type, title, description, earned_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [achievement.id, achievement.user_id, achievement.achievement_type, achievement.title, achievement.description, achievement.earned_at]);
    }
    console.log(`✓ Migrated ${achievements.length} achievements`);

    // Migrate ads
    console.log('📋 Migrating ads...');
    const ads = sqliteDb.prepare('SELECT * FROM ads').all();
    for (const ad of ads) {
      await client.query(`
        INSERT INTO ads (id, title, description, image_url, click_url, impressions, clicks, active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [ad.id, ad.title, ad.description, ad.image_url, ad.click_url, ad.impressions, ad.clicks, ad.active, ad.created_at, ad.updated_at]);
    }
    console.log(`✓ Migrated ${ads.length} ads`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    sqliteDb.close();
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToPostgreSQL()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateToPostgreSQL;