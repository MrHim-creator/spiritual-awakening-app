import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Music, Quote, Radio, FileText, Download, RefreshCw, Trash2, Plus, Eye } from 'lucide-react';

/**
 * Admin Dashboard Component
 * Provides comprehensive admin interface for managing:
 * - Dashboard statistics
 * - Audio files
 * - Quotes
 * - Ads
 * - Users
 * - Backups
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('audio');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Meditation',
    is_premium: false
  });

  const token = localStorage.getItem('authToken');
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // ============================================
  // FETCH DATA
  // ============================================

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'content') {
      fetchAllContent();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'backups') {
      fetchBackups();
    }
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      const [audioRes, quotesRes, adsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/audio`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/admin/quotes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/admin/ads`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const audioData = await audioRes.json();
      const quotesData = await quotesRes.json();
      const adsData = await adsRes.json();

      setAudioFiles(audioData.audioFiles || []);
      setQuotes(quotesData.quotes || []);
      setAds(adsData.ads || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/backup/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBackups(data.backups || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREATE/DELETE FUNCTIONS
  // ============================================

  const createBackup = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Backup created successfully');
        fetchBackups();
      }
    } catch (err) {
      alert('❌ Backup failed: ' + err.message);
    }
  };

  const handleAudioUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('❌ Please select an audio file');
      return;
    }

    if (!formData.title.trim()) {
      alert('❌ Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('audio', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('is_premium', formData.is_premium.toString());

      const response = await fetch(`${API_BASE}/admin/audio/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Audio uploaded to Cloudinary and added successfully!');
        setShowForm(false);
        setSelectedFile(null);
        setFormData({ title: '', description: '', category: 'Meditation', is_premium: false });
        fetchAllContent(); // Refresh the audio list
      } else {
        alert('❌ Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteAudio = async (audioId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/audio/${audioId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Audio deleted');
        fetchAllContent();
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Quote deleted');
        fetchAllContent();
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const deleteAd = async (adId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/ads/${adId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Ad deleted');
        fetchAllContent();
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ============================================
  // RENDER DASHBOARD TAB
  // ============================================

  const renderDashboard = () => {
    if (!stats) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100">Total Users</p>
                <p className="text-3xl font-bold">{stats.users.total}</p>
              </div>
              <Users className="w-12 h-12 opacity-20" />
            </div>
          </div>

          {/* Premium Users */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-100">Premium Users</p>
                <p className="text-3xl font-bold">{stats.users.premium}</p>
              </div>
              <Radio className="w-12 h-12 opacity-20" />
            </div>
          </div>

          {/* Content Items */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-purple-100">Audio Files</p>
                <p className="text-3xl font-bold">{stats.content.audio_files}</p>
              </div>
              <Music className="w-12 h-12 opacity-20" />
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-orange-100">Audio Sessions</p>
                <p className="text-3xl font-bold">{stats.usage.audio_sessions}</p>
              </div>
              <FileText className="w-12 h-12 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">User Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Premium', value: stats.users.premium },
                    { name: 'Free', value: stats.users.free }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Content Overview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Content Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Quotes', value: stats.content.quotes },
                { name: 'Audio', value: stats.content.audio_files },
                { name: 'Ads', value: stats.content.ads }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER CONTENT MANAGEMENT TAB
  // ============================================

  const renderContentManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('audio')}
            className={`px-4 py-2 rounded ${selectedTab === 'audio' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            🎵 Audio Files ({audioFiles.length})
          </button>
          <button
            onClick={() => setSelectedTab('quotes')}
            className={`px-4 py-2 rounded ${selectedTab === 'quotes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            💬 Quotes ({quotes.length})
          </button>
          <button
            onClick={() => setSelectedTab('ads')}
            className={`px-4 py-2 rounded ${selectedTab === 'ads' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            📢 Ads ({ads.length})
          </button>
        </div>

        {/* Audio Files */}
        {selectedTab === 'audio' && (
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-4 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Audio
            </button>

            {/* Audio Upload Form */}
            {showForm && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Upload New Audio File</h3>
                <form onSubmit={handleAudioUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audio File *
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: MP3, WAV, M4A, etc. Max 50MB
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter audio title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter audio description"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Meditation">Meditation</option>
                        <option value="Frequency">Frequency</option>
                        <option value="Guided">Guided</option>
                        <option value="Music">Music</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Premium Content
                      </label>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={formData.is_premium}
                          onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Require premium subscription
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
                      <Music className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedFile(null);
                        setFormData({ title: '', description: '', category: 'Meditation', is_premium: false });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {audioFiles.map(audio => (
                <div key={audio.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{audio.title}</p>
                    <p className="text-sm text-gray-600">{audio.category} • {(audio.duration_seconds / 60).toFixed(1)} min • {audio.plays} plays</p>
                  </div>
                  <button
                    onClick={() => deleteAudio(audio.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes */}
        {selectedTab === 'quotes' && (
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-4 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Quote
            </button>

            <div className="space-y-2">
              {quotes.map(quote => (
                <div key={quote.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="italic">"{quote.text}"</p>
                    <p className="text-sm text-gray-600">— {quote.author} • {quote.views} views</p>
                  </div>
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ads */}
        {selectedTab === 'ads' && (
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-4 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Ad
            </button>

            <div className="space-y-2">
              {ads.map(ad => (
                <div key={ad.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{ad.title}</p>
                    <p className="text-sm text-gray-600">{ad.impressions} impressions • {ad.clicks} clicks • {ad.active ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER USERS TAB
  // ============================================

  const renderUsers = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Subscription</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3">{user.username}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-white text-sm ${user.subscription_type === 'premium' ? 'bg-green-600' : 'bg-gray-400'}`}>
                    {user.subscription_type}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {user.is_admin === 1 ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">👑 Admin</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ============================================
  // RENDER BACKUPS TAB
  // ============================================

  const renderBackups = () => {
    return (
      <div className="space-y-6">
        <button
          onClick={createBackup}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Download className="w-5 h-5" /> Create Backup Now
        </button>

        <div className="grid gap-4">
          {backups.map(backup => (
            <div key={backup.filename} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{backup.filename}</p>
                  <p className="text-sm text-gray-600">
                    {backup.sizeKB} KB • {new Date(backup.created).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => alert('Download restore coming soon')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading && !stats && !audioFiles.length && !users.length) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">👨‍💼 Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your Spiritual Awakening app</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 font-semibold ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            📝 Content
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-6 py-3 font-semibold ${activeTab === 'backups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            💾 Backups
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'content' && renderContentManagement()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'backups' && renderBackups()}
        </div>
      </div>
    </div>
  );
}
