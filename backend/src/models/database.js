import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'app.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✓ Created data directory');
}

// Initialize database
const db = new Database(dbPath);
console.log('✓ Database connected');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
export const initializeDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      subscription_type TEXT DEFAULT 'free',
      subscription_end_date TEXT,
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

  // Quotes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT,
      source TEXT,
      is_premium INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User favorites table
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

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      stripe_subscription_id TEXT,
      plan_type TEXT,
      status TEXT DEFAULT 'active',
      current_period_end TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Ads table
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

  // Audio files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audio_files (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      duration_seconds INTEGER,
      category TEXT,
      is_premium INTEGER DEFAULT 0,
      plays INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audio sessions table
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

  // Achievements table
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

  // Seed quotes (only if table is empty)
  const quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
  
  if (quoteCount === 0) {
    const quotes = [
      // Confucius quotes
      { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'The superior man is modest in his speech, but exceeds in his actions.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      { text: 'When you know a thing, to hold that you know it; and when you do not know a thing, to allow that you do not know it - this is knowledge.', author: 'Confucius', category: 'wisdom', source: 'Confucius' },
      
      // Anime quotes
      { text: 'I am not afraid to keep on living.', author: 'Hikari Yumeno', category: 'anime', source: 'Attack on Titan', is_premium: 0 },
      { text: 'People die when they are killed.', author: 'Shiro Emiya', category: 'anime', source: 'Fate/stay night', is_premium: 0 },
      { text: 'Even if I die, I want to protect my friends. I want to die. That is the only thing I am afraid of.', author: 'Naruto Uzumaki', category: 'anime', source: 'Naruto', is_premium: 0 },
      { text: 'You can have the body, but you will always be a stepchild in this family.', author: 'Ichigo Kurosaki', category: 'anime', source: 'Bleach', is_premium: 0 },
      { text: 'A person is smart. People are dumb.', author: 'Madara Uchiha', category: 'anime', source: 'Naruto', is_premium: 0 },
      
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

    const insertQuote = db.prepare(`
      INSERT INTO quotes (id, text, author, category, source, is_premium, views)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    quotes.forEach((quote, index) => {
      insertQuote.run(
        `quote_${index + 1}`,
        quote.text,
        quote.author,
        quote.category,
        quote.source,
        quote.is_premium || 0,
        0
      );
    });

    console.log('✓ Database seeded with 25+ quotes');
  }

  // Seed audio files (only if table is empty)
  const audioCount = db.prepare('SELECT COUNT(*) as count FROM audio_files').get().count;

  if (audioCount === 0) {
    const audioFiles = [
      {
        id: 'audio_1',
        title: '10-Minute Breathing Meditation',
        description: 'Calm your mind with this simple breathing exercise',
        file_url: 'https://example.com/audio/breathing-meditation.mp3', // Replace with actual URL
        duration_seconds: 600,
        category: 'Breathing',
        is_premium: 0
      },
      {
        id: 'audio_2',
        title: '20-Minute Body Scan',
        description: 'Relax your body from head to toe',
        file_url: 'https://example.com/audio/body-scan.mp3', // Replace with actual URL
        duration_seconds: 1200,
        category: 'Body Scan',
        is_premium: 0
      },
      {
        id: 'audio_3',
        title: '174 Hz - Pain Relief',
        description: 'Binaural beats for pain relief',
        file_url: 'https://example.com/audio/174hz-pain-relief.mp3', // Replace with actual URL
        duration_seconds: 3600,
        category: 'Healing',
        is_premium: 1
      },
      {
        id: 'audio_4',
        title: '528 Hz - Love Frequency',
        description: 'Healing frequency for love and peace',
        file_url: 'https://example.com/audio/528hz-love-frequency.mp3', // Replace with actual URL
        duration_seconds: 3600,
        category: 'Healing',
        is_premium: 1
      }
    ];

    const insertAudio = db.prepare(`
      INSERT INTO audio_files (id, title, description, file_url, duration_seconds, category, is_premium, plays)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    audioFiles.forEach(audio => {
      insertAudio.run(
        audio.id,
        audio.title,
        audio.description,
        audio.file_url,
        audio.duration_seconds,
        audio.category,
        audio.is_premium,
        0
      );
    });

    console.log('✓ Database seeded with 4 audio files');
  }
};

// Initialize on import
initializeDatabase();

export default db;