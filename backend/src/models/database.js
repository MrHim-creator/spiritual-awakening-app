import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine database type from environment
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'
let db;

if (DB_TYPE === 'postgres') {
  // PostgreSQL configuration
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Test connection
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to PostgreSQL:', err);
      process.exit(1);
    }
    release();
    console.log('✓ PostgreSQL database connected');
  });

  db = {
    // PostgreSQL wrapper methods to match SQLite API
    prepare: (query) => ({
      run: async (...params) => {
        const client = await pool.connect();
        try {
          const result = await client.query(query, params);
          return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount };
        } finally {
          client.release();
        }
      },
      get: async (...params) => {
        const client = await pool.connect();
        try {
          const result = await client.query(query, params);
          return result.rows[0];
        } finally {
          client.release();
        }
      },
      all: async (...params) => {
        const client = await pool.connect();
        try {
          const result = await client.query(query, params);
          return result.rows;
        } finally {
          client.release();
        }
      }
    }),
    exec: async (query) => {
      const client = await pool.connect();
      try {
        await client.query(query);
      } finally {
        client.release();
      }
    },
    close: () => pool.end()
  };
} else {
  // SQLite configuration (development)
  const dbDir = path.join(__dirname, '../../data');
  const dbPath = path.join(dbDir, 'app.db');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✓ Created data directory');
  }

  // Initialize database
  db = new Database(dbPath);
  console.log('✓ SQLite database connected');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');
}

// Create tables
export const initializeDatabase = async () => {
  if (DB_TYPE === 'postgres') {
    // PostgreSQL schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        source TEXT,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, quote_id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_type TEXT DEFAULT 'free',
        status TEXT DEFAULT 'active',
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        click_url TEXT,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS audio_files (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        duration_seconds INTEGER,
        category TEXT,
        plays INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS audio_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        audio_type TEXT,
        audio_id TEXT,
        duration_seconds INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_type TEXT,
        title TEXT,
        description TEXT,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

  } else {
    // SQLite schema (development)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_admin column if it doesn't exist (migration for existing databases)
    try {
      db.prepare('SELECT is_admin FROM users LIMIT 1').get();
    } catch {
      db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
      console.log('✓ Added is_admin column to users table');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        source TEXT,
        views INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id TEXT NOT NULL,
        quote_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, quote_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        plan_type TEXT DEFAULT 'free',
        status TEXT DEFAULT 'active',
        current_period_end TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        click_url TEXT,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audio_files (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        duration_seconds INTEGER,
        category TEXT,
        plays INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audio_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        audio_type TEXT,
        audio_id TEXT,
        duration_seconds INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_type TEXT,
        title TEXT,
        description TEXT,
        earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  console.log('✓ Database tables initialized');

  // Seed quotes (only if table is empty)
  let quoteCount;
  if (DB_TYPE === 'postgres') {
    const result = await db.prepare('SELECT COUNT(*) as count FROM quotes').get();
    quoteCount = result.count;
  } else {
    quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
  }

  if (quoteCount === 0) {
    const quotes = [
      // Confucius quotes
      { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'The superior man is modest in his speech, but exceeds in his actions.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'When you know a thing, to hold that you know it; and when you do not know a thing, to allow that you do not know it - this is knowledge.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },

      // Anime quotes
      { text: 'I am not afraid to keep on living.', author: 'Hikari Yumeno', category: 'anime', source: 'Attack on Titan' },
      { text: 'People die when they are killed.', author: 'Shiro Emiya', category: 'anime', source: 'Fate/stay night' },
      { text: 'Even if I die, I want to protect my friends. I want to die. That is the only thing I am afraid of.', author: 'Naruto Uzumaki', category: 'anime', source: 'Naruto' },
      { text: 'You can have the body, but you will always be a stepchild in this family.', author: 'Ichigo Kurosaki', category: 'anime', source: 'Bleach' },
      { text: 'A person is smart. People are dumb.', author: 'Madara Uchiha', category: 'anime', source: 'Naruto' },

      // Psychological quotes
      { text: 'The only way out is through.', author: 'Robert Frost', category: 'psychology', source: 'Robert Frost' },
      { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'psychology', source: 'Ralph Waldo Emerson' },
      { text: 'You are not a drop in the ocean. You are the entire ocean in a drop.', author: 'Rumi', category: 'spiritual', source: 'Rumi' },
      { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela', category: 'psychology', source: 'Nelson Mandela' },
      { text: 'Everything you want is on the other side of fear.', author: 'Jack Canfield', category: 'psychology', source: 'Jack Canfield' },

      // Spiritual quotes
      { text: 'The cave you fear to enter holds the treasure you seek.', author: 'Joseph Campbell', category: 'spiritual', source: 'Joseph Campbell' },
      { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde', category: 'spiritual', source: 'Oscar Wilde' },
      { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', category: 'spiritual', source: 'Albert Einstein' },
      { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'wisdom', source: 'Socrates' },
      { text: 'I came here to chew bubblegum and kick ass. And I\'m all out of bubblegum.', author: 'John Carpenter', category: 'wisdom', source: 'John Carpenter' },

      // Additional wisdom quotes
      { text: 'Do or do not. There is no try.', author: 'Yoda', category: 'wisdom', source: 'Star Wars' },
      { text: 'The only constant in life is change.', author: 'Heraclitus', category: 'wisdom', source: 'Heraclitus' },
      { text: 'We cannot change what we are not aware of, and once we are aware, we cannot help but change.', author: 'Sheryl Sandberg', category: 'psychology', source: 'Sheryl Sandberg' },
      { text: 'Your time is limited, do not waste it living someone else\'s life.', author: 'Steve Jobs', category: 'wisdom', source: 'Steve Jobs' },
      { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela', category: 'spiritual', source: 'Nelson Mandela' },
      { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'wisdom', source: 'Chinese Proverb' },
    ];

    if (DB_TYPE === 'postgres') {
      const insertQuote = db.prepare(`
        INSERT INTO quotes (id, text, author, category, source, views)
        VALUES ($1, $2, $3, $4, $5, $6)
      `);

      for (const quote of quotes) {
        await insertQuote.run(
          `quote_${quotes.indexOf(quote) + 1}`,
          quote.text,
          quote.author,
          quote.category,
          quote.source,
          0
        );
      }
    } else {
      const insertQuote = db.prepare(`
        INSERT INTO quotes (id, text, author, category, source, views)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      quotes.forEach((quote, index) => {
        insertQuote.run(
          `quote_${index + 1}`,
          quote.text,
          quote.author,
          quote.category,
          quote.source,
          0
        );
      });
    }

    console.log('✓ Database seeded with 25+ quotes');
  }

  // Seed audio files (only if table is empty)
  let audioCount;
  if (DB_TYPE === 'postgres') {
    const result = await db.prepare('SELECT COUNT(*) as count FROM audio_files').get();
    audioCount = result.count;
  } else {
    audioCount = db.prepare('SELECT COUNT(*) as count FROM audio_files').get().count;
  }

  if (audioCount === 0) {
    const audioFiles = [
      {
        id: 'audio_1',
        title: '10-Minute Breathing Meditation',
        description: 'Calm your mind with this simple breathing exercise',
        file_url: 'https://example.com/audio/breathing-meditation.mp3', // Replace with actual URL
        duration_seconds: 600,
        category: 'Breathing'
      },
      {
        id: 'audio_2',
        title: '20-Minute Body Scan',
        description: 'Relax your body from head to toe',
        file_url: 'https://example.com/audio/body-scan.mp3', // Replace with actual URL
        duration_seconds: 1200,
        category: 'Body Scan'
      },
      {
        id: 'audio_3',
        title: '174 Hz - Pain Relief',
        description: 'Binaural beats for pain relief',
        file_url: 'https://example.com/audio/174hz-pain-relief.mp3', // Replace with actual URL
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_4',
        title: '528 Hz - Love Frequency',
        description: 'Healing frequency for love and peace',
        file_url: 'https://example.com/audio/528hz-love-frequency.mp3', // Replace with actual URL
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_5',
        title: '396 Hz - Liberation from Fear',
        description: 'Release fear and guilt with this powerful frequency',
        file_url: 'https://example.com/audio/396hz-fear-liberation.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_6',
        title: '417 Hz - Change & Transformation',
        description: 'Facilitate positive change and break negative patterns',
        file_url: 'https://example.com/audio/417hz-transformation.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_7',
        title: '639 Hz - Heart Chakra',
        description: 'Balance relationships and heart energy',
        file_url: 'https://example.com/audio/639hz-heart-chakra.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_8',
        title: '741 Hz - Expression & Solutions',
        description: 'Enhance self-expression and find solutions',
        file_url: 'https://example.com/audio/741hz-expression.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_9',
        title: '852 Hz - Intuition & Spiritual Order',
        description: 'Connect with your inner wisdom',
        file_url: 'https://example.com/audio/852hz-intuition.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      },
      {
        id: 'audio_10',
        title: '963 Hz - Crown Chakra',
        description: 'Connect with divine consciousness',
        file_url: 'https://example.com/audio/963hz-crown-chakra.mp3',
        duration_seconds: 3600,
        category: 'Healing'
      }
    ];

    if (DB_TYPE === 'postgres') {
      const insertAudio = db.prepare(`
        INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, plays)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `);

      for (const audio of audioFiles) {
        await insertAudio.run(
          audio.id,
          audio.title,
          audio.description,
          audio.file_url,
          audio.duration_seconds,
          audio.category,
          0
        );
      }
    } else {
      const insertAudio = db.prepare(`
        INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, plays)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      audioFiles.forEach(audio => {
        insertAudio.run(
          audio.id,
          audio.title,
          audio.description,
          audio.file_url,
          audio.duration_seconds,
          audio.category,
          0
        );
      });
    }

    console.log('✓ Database seeded with 10 audio files');
  }
};

// Initialize on import
if (DB_TYPE === 'postgres') {
  initializeDatabase().catch(console.error);
} else {
  initializeDatabase();
}

export default db;