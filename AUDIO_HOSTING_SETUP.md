# Audio Hosting Setup Guide

## Free Options for Audio File Hosting

### Option 1: Cloudinary (Recommended) ⭐
**Best for**: Streaming audio, transformations, optimization
- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Setup Time**: 5 minutes
- **URL Format**: Direct streaming-optimized URLs

### Option 2: Archive.org (Internet Archive)
**Best for**: Free/open-source content
- **Free Tier**: Unlimited storage, no bandwidth limits
- **Setup Time**: 10 minutes
- **Perfect for**: Public domain meditation audio

### Option 3: Self-Hosting on Render
**Best for**: Privacy-focused
- **Free Tier**: Yes (with limitations)
- **Storage**: Limited to Render disk
- **Note**: Requires serving files through backend

---

## Setup: Cloudinary (Recommended) ✅

### Step 1: Create Free Account
1. Go to [Cloudinary.com](https://cloudinary.com/users/register/free)
2. Sign up with email
3. Verify email

### Step 2: Get API Credentials
1. Login to [Cloudinary Console](https://cloudinary.com/console)
2. Note your **Cloud Name** (top of dashboard)
3. Copy **API Key** and **API Secret**

### Step 3: Add to Backend .env
```bash
# Audio Hosting
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 4: Create Upload Preset
1. Go to Settings → Upload
2. Scroll to "Upload presets"
3. Create new preset named: `spiritual_awakening_audio`
4. Settings:
   - Mode: Unsigned
   - Resource type: Auto
   - Format: Keep original

### Step 5: Update Audio URLs in Database

#### Option A: Manually Update (Quick)
```bash
# Via SQLite CLI
sqlite3 ./data/app.db

UPDATE audio_files SET file_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/breathing-meditation.mp3' 
WHERE id = 'audio_1';
```

#### Option B: Use Migration Script

Create `scripts/migrate-audio-urls.js`:

```javascript
import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

// Map of local audio IDs to Cloudinary URLs
const audioUrlMap = {
  'audio_1': 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/breathing-meditation.mp3',
  'audio_2': 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/body-scan.mp3',
  'audio_3': 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/174hz-pain-relief.mp3',
  'audio_4': 'https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/528hz-love-frequency.mp3'
};

// Update all audio files
for (const [audioId, url] of Object.entries(audioUrlMap)) {
  db.prepare('UPDATE audio_files SET file_url = ? WHERE id = ?').run(url, audioId);
  console.log(`✓ Updated ${audioId}`);
}

db.close();
console.log('✓ Audio URLs migrated successfully');
```

Run: `node scripts/migrate-audio-urls.js`

---

## Using Cloudinary API in Admin Panel

### Upload New Audio File

```javascript
// frontend/src/components/AdminAudioUpload.jsx
import { useState } from 'react';
import axios from 'axios';

export default function AdminAudioUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem('authToken');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'spiritual_awakening_audio');

      const uploadRes = await axios.post(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload',
        formData
      );

      // Step 2: Save audio metadata to backend
      const audioRes = await axios.post(
        'http://localhost:5000/api/admin/audio',
        {
          title: file.name,
          description: 'Uploaded via admin panel',
          file_url: uploadRes.data.secure_url,
          duration_seconds: Math.round(uploadRes.data.duration || 0),
          category: 'User Upload',
          is_premium: 0
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('✅ Audio uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Upload Audio</h2>
      
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
        className="mb-4"
      />

      <button
        type="submit"
        disabled={uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Audio'}
      </button>
    </form>
  );
}
```

---

## Audio URL Format

### Standard URL
```
https://res.cloudinary.com/CLOUD_NAME/video/upload/FILE_ID.mp3
```

### Optimized Streaming URL
```
https://res.cloudinary.com/CLOUD_NAME/video/upload/q_auto,br_128k,f_mp3/FILE_ID.mp3
```

**Parameters:**
- `q_auto` - Automatic quality optimization
- `br_128k` - Bitrate (64k, 128k, 192k, 256k)
- `f_mp3` - Format (mp3, m4a, ogg, wav)

### Example URLs for Your Audio Files

```javascript
// In your database
{
  "id": "audio_1",
  "title": "10-Minute Breathing Meditation",
  "file_url": "https://res.cloudinary.com/spiritual-awakening/video/upload/q_auto,br_128k,f_mp3/v1703077200/breathing-meditation.mp3",
  "duration_seconds": 600
}
```

---

## Alternative: Archive.org Upload

If you prefer Archive.org for public domain content:

```javascript
// Upload to Archive.org
const uploadToArchiveOrg = async (file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filetype', 'audio');
  formData.append('access', 'open');

  const response = await fetch(`https://archive.org/upload.php`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

**Note:** Archive.org has different terms and may require content to be public domain.

---

## Self-Hosting on Render

If you want to serve audio files from your backend:

```javascript
// backend/src/routes/media.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/audio/:audioId', (req, res) => {
  const { audioId } = req.params;
  const filePath = path.join(process.cwd(), 'media', 'audio', `${audioId}.mp3`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio not found' });
  }

  // Stream the file
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

export default router;
```

**Pros:**
- ✅ Full control
- ✅ No third-party dependencies

**Cons:**
- ❌ Limited bandwidth on free tier
- ❌ Slow for many concurrent users
- ❌ Uses up disk space

---

## Testing Audio URLs

### Using curl
```bash
# Test Cloudinary URL
curl -I https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/YOUR_FILE.mp3

# Should return 200 OK
# HTTP/1.1 200 OK
# Content-Type: audio/mpeg
# Content-Length: 1234567
```

### Testing in React
```javascript
const testAudioUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`✓ Audio URL valid: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`✗ Audio URL invalid: ${error.message}`);
    return false;
  }
};

// Usage
testAudioUrl('https://res.cloudinary.com/.../audio.mp3');
```

---

## API Endpoint to Add Audio with URL

```bash
curl -X POST http://localhost:5000/api/admin/audio \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "10-Minute Breathing Meditation",
    "description": "Calm meditation",
    "file_url": "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/q_auto,br_128k,f_mp3/breathing-meditation.mp3",
    "duration_seconds": 600,
    "category": "Breathing",
    "is_premium": 0
  }'
```

---

## Troubleshooting

**Issue**: Upload preset not found
**Solution**: Make sure preset name is exactly `spiritual_awakening_audio` and set to Unsigned

**Issue**: 403 Forbidden when uploading
**Solution**: Check Cloud Name and API credentials in .env

**Issue**: Audio files not streaming
**Solution**: 
1. Check URL format is correct
2. Test with curl: `curl -I URL`
3. Verify file permissions in Cloudinary console

**Issue**: High bandwidth usage
**Solution**: Use optimized URLs with `q_auto,br_128k,f_mp3` parameters

---

## Next Steps

1. ✅ Choose hosting (Cloudinary recommended)
2. ✅ Set up account and API keys
3. ✅ Add credentials to .env
4. ✅ Migrate audio URLs to database
5. ⏭️ Test audio playback in app
6. ⏭️ Create admin upload interface

