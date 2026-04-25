# Admin Setup Guide

## Quick Start: Set Up Your First Admin Account

### Step 1: Register a User Account
If you don't already have an account, register one:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

### Step 2: Make Your User an Admin

Navigate to the backend data directory and open SQLite:

**Option A: Using SQLite CLI (Recommended)**
```bash
cd spiritual-awakening-production/backend

# Linux/Mac
sqlite3 ./data/app.db "UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';"

# Windows PowerShell (if you have sqlite3 installed)
sqlite3 ./data/app.db "UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';"
```

**Option B: Using Node.js Script**

Create `setup-admin.js` in the backend directory:
```javascript
import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node setup-admin.js <email>');
  process.exit(1);
}

const result = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);

if (result.changes === 0) {
  console.error(`❌ User not found: ${email}`);
} else {
  console.log(`✅ Admin privileges granted to: ${email}`);
}

db.close();
```

Then run:
```bash
node setup-admin.js admin@example.com
```

**Option C: Direct Database Edit (SQLite Browser)**
1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open `backend/data/app.db`
3. Go to the `users` table
4. Find your user row
5. Set `is_admin` column to `1`
6. Save

### Step 3: Login and Get JWT Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1",
    "email": "admin@example.com",
    "username": "admin",
    "subscription_type": "free"
  }
}
```

### Step 4: Test Admin Access

Use the token to access admin endpoints:

```bash
curl -X GET http://localhost:5000/api/admin/stats/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Success response:
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 5,
      "premium": 1,
      "free": 4
    },
    "content": {
      "quotes": 25,
      "audio_files": 4,
      "ads": 0
    },
    "usage": {
      "audio_sessions": 150
    }
  }
}
```

---

## 🎯 Common Admin Tasks

### Create Admin Panel (React)

Create `frontend/src/pages/AdminPage.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/admin/stats/dashboard',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold">Total Users</h3>
          <p className="text-2xl">{stats?.users.total}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold">Premium Users</h3>
          <p className="text-2xl">{stats?.users.premium}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-bold">Audio Files</h3>
          <p className="text-2xl">{stats?.content.audio_files}</p>
        </div>
      </div>
    </div>
  );
}
```

### Add Audio File via Admin API

```javascript
const addAudio = async (audioData) => {
  const response = await fetch(
    'http://localhost:5000/api/admin/audio',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: audioData.title,
        description: audioData.description,
        file_url: audioData.file_url,
        duration_seconds: audioData.duration,
        category: audioData.category,
        is_premium: audioData.isPremium ? 1 : 0
      })
    }
  );
  return await response.json();
};
```

### Add Quotes via Admin API

```javascript
const addQuote = async (quoteData) => {
  const response = await fetch(
    'http://localhost:5000/api/admin/quotes',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: quoteData.text,
        author: quoteData.author,
        category: quoteData.category,
        source: quoteData.source,
        is_premium: quoteData.isPremium ? 1 : 0
      })
    }
  );
  return await response.json();
};
```

---

## 🔒 Admin Permissions

### What Can Admins Do?

✅ **Audio Files**
- View all audio files with play counts
- Create new audio files
- Update audio metadata
- Delete audio files

✅ **Quotes**
- View all quotes
- Create new quotes
- Update quotes
- Delete quotes

✅ **Ads**
- View all ads with impression/click stats
- Create new ads
- Update ad campaigns
- Delete ads

✅ **Users**
- View all users (email, username, subscription status)
- Grant admin privileges to other users
- Revoke admin privileges

✅ **Analytics**
- View dashboard statistics
- See user counts and subscription breakdown
- Monitor audio session usage

### What Can't Admins Do?

❌ Delete user accounts (prevents accidental data loss)
❌ Modify user passwords
❌ Bypass payment verification
❌ Change their own admin status (except in database)

---

## Security Best Practices

1. **Secure Your Admin Account**
   - Use a strong password (min 12 characters)
   - Enable 2FA when implemented
   - Don't share your token

2. **Audit Logs**
   - All admin actions are logged
   - Check logs regularly: `backend/logs/app.log`

3. **Token Management**
   - Tokens expire after 24 hours
   - Login again to get a new token
   - Never commit tokens to version control

4. **Database Backups**
   - Back up `backend/data/app.db` regularly
   - Store in secure location
   - Test restore procedures

---

## Troubleshooting

**Q: Getting 403 Forbidden?**
A: Check that `is_admin = 1` in database for your user.

**Q: Getting 401 Unauthorized?**
A: Your token expired. Login again to get a new one.

**Q: Can't find SQLite CLI?**
A: Use the Node.js setup script (Option B) or DB Browser (Option C) instead.

**Q: Changes not reflected?**
A: Server might be caching. Restart the backend server.

---

## Monitoring

Check admin logs:
```bash
# View real-time logs
tail -f backend/logs/app.log

# Search for admin actions
grep "Admin" backend/logs/app.log

# See all errors
grep "ERROR" backend/logs/app.log
```

---

## Next Steps

After admin setup:
1. ✅ Set up admin account
2. 📝 Add content (audio, quotes, ads)
3. 📊 Monitor dashboard
4. 🛡️ Set up backups
5. 🧪 Run unit tests

See [ADMIN_API.md](./ADMIN_API.md) for full API reference.
