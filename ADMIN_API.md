# Admin Panel API Reference

## Overview
The Admin Panel provides comprehensive management endpoints for audio files, quotes, ads, and user management. All endpoints require authentication **AND** admin privileges.

## Authentication
All admin endpoints require:
1. **Valid JWT token** (from login)
2. **Admin privileges** (is_admin = 1 in database)

### Getting Admin Access
Only existing admins can promote new admins:
```bash
POST /api/admin/users/:userId/make-admin
Headers: Authorization: Bearer {JWT_TOKEN}
```

## Base URL
```
/api/admin
```

## Endpoints

### 📊 Dashboard Stats

#### Get Dashboard Statistics
```
GET /api/admin/stats/dashboard
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 150,
      "premium": 45,
      "free": 105
    },
    "content": {
      "quotes": 100,
      "audio_files": 25,
      "ads": 10
    },
    "usage": {
      "audio_sessions": 5000
    }
  }
}
```

---

### 🎵 Audio Files Management

#### Get All Audio Files
```
GET /api/admin/audio
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "audioFiles": [
    {
      "id": "audio_1",
      "title": "10-Minute Breathing Meditation",
      "description": "Calm your mind with this simple breathing exercise",
      "file_url": "https://example.com/audio/breathing.mp3",
      "duration_seconds": 600,
      "category": "Breathing",
      "is_premium": 0,
      "plays": 150,
      "created_at": "2026-04-24T10:00:00.000Z",
      "updated_at": "2026-04-24T10:00:00.000Z"
    }
  ]
}
```

#### Create New Audio File
```
POST /api/admin/audio
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "title": "5-Minute Relaxation",
  "description": "Quick relaxation session",
  "file_url": "https://example.com/audio/relaxation.mp3",
  "duration_seconds": 300,
  "category": "Meditation",
  "is_premium": 0
}
```

**Required Fields:** `title`, `file_url`
**Optional Fields:** `description`, `duration_seconds`, `category`, `is_premium`

#### Update Audio File
```
PUT /api/admin/audio/:audioId
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "title": "Updated Title",
  "plays": 200,
  "is_premium": 1
}
```

#### Delete Audio File
```
DELETE /api/admin/audio/:audioId
Authorization: Bearer {JWT_TOKEN}
```

---

### 💬 Quotes Management

#### Get All Quotes
```
GET /api/admin/quotes
```

#### Create New Quote
```
POST /api/admin/quotes
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "text": "The only way out is through.",
  "author": "Robert Frost",
  "category": "wisdom",
  "source": "Robert Frost",
  "is_premium": 0
}
```

**Required Fields:** `text`, `author`
**Optional Fields:** `category`, `source`, `is_premium`

#### Update Quote
```
PUT /api/admin/quotes/:quoteId
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "text": "Updated quote text",
  "category": "psychology"
}
```

#### Delete Quote
```
DELETE /api/admin/quotes/:quoteId
Authorization: Bearer {JWT_TOKEN}
```

---

### 📢 Ads Management

#### Get All Ads
```
GET /api/admin/ads
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "ads": [
    {
      "id": "ad_1",
      "title": "Meditation App",
      "description": "Try our meditation app",
      "image_url": "https://example.com/images/ad.jpg",
      "click_url": "https://example.com/download",
      "impressions": 1000,
      "clicks": 50,
      "active": 1,
      "created_at": "2026-04-20T10:00:00.000Z",
      "updated_at": "2026-04-24T15:30:00.000Z"
    }
  ]
}
```

#### Create New Ad
```
POST /api/admin/ads
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "title": "New Product",
  "description": "Check out our new product",
  "image_url": "https://example.com/image.jpg",
  "click_url": "https://example.com/product",
  "active": 1
}
```

**Required Fields:** `title`, `click_url`
**Optional Fields:** `description`, `image_url`, `active`

#### Update Ad
```
PUT /api/admin/ads/:adId
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "title": "Updated Title",
  "active": 0
}
```

#### Delete Ad
```
DELETE /api/admin/ads/:adId
Authorization: Bearer {JWT_TOKEN}
```

---

### 👥 Users Management

#### Get All Users
```
GET /api/admin/users
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_users": 150,
    "premium_users": 45,
    "admins": 2
  },
  "users": [
    {
      "id": "user_1",
      "email": "user@example.com",
      "username": "john_doe",
      "subscription_type": "premium",
      "is_admin": 0,
      "created_at": "2026-04-10T10:00:00.000Z"
    }
  ]
}
```

#### Make User Admin
```
POST /api/admin/users/:userId/make-admin
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "User user@example.com is now an admin",
  "userId": "user_1"
}
```

#### Revoke Admin Privileges
```
POST /api/admin/users/:userId/revoke-admin
Authorization: Bearer {JWT_TOKEN}
```

**Note:** You cannot revoke your own admin privileges.

---

## Error Responses

### 401 Unauthorized - Not Authenticated
```json
{
  "error": "Authentication required",
  "message": "Please login first"
}
```

### 403 Forbidden - Not Admin
```json
{
  "error": "Access Denied",
  "message": "You do not have admin privileges"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "resourceId": "audio_1"
}
```

### 400 Bad Request - Validation Error
```json
{
  "error": "Validation Error",
  "message": "title and file_url are required",
  "required": ["title", "file_url"]
}
```

### 500 Server Error
```json
{
  "error": "Failed to create audio file",
  "message": "Detailed error message"
}
```

---

## Setup Instructions

### 1. Create First Admin User

Since the admin middleware requires `is_admin = 1`, you need to manually set the first admin:

```javascript
// Run this in Node.js or use sqlite3 CLI:
const db = require('better-sqlite3')('./data/app.db');
db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('your-email@example.com');
```

Or via SQLite CLI:
```bash
sqlite3 ./data/app.db "UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';"
```

### 2. Get JWT Token

First, login to get your JWT token:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 3. Use Admin Endpoints

Use the token in Authorization header:
```bash
curl -X GET http://localhost:5000/api/admin/stats/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Best Practices

1. **Security**: Always use HTTPS in production
2. **Rate Limiting**: Admin endpoints are rate-limited like others
3. **Auditing**: All admin actions are logged with admin email
4. **Validation**: All inputs are validated before database operations
5. **Premium Content**: Mark premium audio/quotes with `is_premium: 1`

---

## Common Use Cases

### Add New Meditation Audio
```bash
curl -X POST http://localhost:5000/api/admin/audio \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "30-Minute Deep Meditation",
    "description": "Advanced meditation for experienced practitioners",
    "file_url": "https://cdn.example.com/deep-meditation.mp3",
    "duration_seconds": 1800,
    "category": "Meditation",
    "is_premium": 1
  }'
```

### Bulk Update Quote
```bash
curl -X PUT http://localhost:5000/api/admin/quotes/quote_1 \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "psychology",
    "is_premium": 1
  }'
```

### Deactivate Ad
```bash
curl -X PUT http://localhost:5000/api/admin/ads/ad_1 \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "active": 0
  }'
```

---

## Troubleshooting

**Issue**: Getting 403 Forbidden on admin endpoints
- **Solution**: Verify `is_admin = 1` in users table for your user

**Issue**: 401 Unauthorized
- **Solution**: Make sure JWT token is valid and not expired (24h default)

**Issue**: Missing required fields error
- **Solution**: Check API documentation for required vs optional fields

---

## Frontend Integration

### Example React Hook for Admin API

```javascript
import axios from 'axios';

const useAdminAPI = () => {
  const token = localStorage.getItem('authToken');
  
  const adminClient = axios.create({
    baseURL: 'http://localhost:5000/api/admin',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    getAudioFiles: () => adminClient.get('/audio'),
    createAudio: (data) => adminClient.post('/audio', data),
    updateAudio: (id, data) => adminClient.put(`/audio/${id}`, data),
    deleteAudio: (id) => adminClient.delete(`/audio/${id}`),
    
    getQuotes: () => adminClient.get('/quotes'),
    createQuote: (data) => adminClient.post('/quotes', data),
    updateQuote: (id, data) => adminClient.put(`/quotes/${id}`, data),
    deleteQuote: (id) => adminClient.delete(`/quotes/${id}`),
    
    getAds: () => adminClient.get('/ads'),
    createAd: (data) => adminClient.post('/ads', data),
    updateAd: (id, data) => adminClient.put(`/ads/${id}`, data),
    deleteAd: (id) => adminClient.delete(`/ads/${id}`),
    
    getUsers: () => adminClient.get('/users'),
    makeAdmin: (userId) => adminClient.post(`/users/${userId}/make-admin`),
    revokeAdmin: (userId) => adminClient.post(`/users/${userId}/revoke-admin`),
    
    getDashboardStats: () => adminClient.get('/stats/dashboard')
  };
};
```

---

## Next Steps

1. ✅ Admin routes created
2. 📋 Create admin dashboard UI in React
3. 🔐 Add role-based access control
4. 📊 Build analytics dashboard
5. 🔔 Add admin notifications

