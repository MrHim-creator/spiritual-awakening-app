import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Loader } from 'lucide-react';
import { useAuthStore, useAppStore, useAudioStore } from '../store';
import { authAPI, handleApiError } from '../api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addNotification } = useAppStore();
  const { stats } = useAudioStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await authAPI.updateProfile(formData);
      addNotification({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      setIsEditing(false);
    } catch (error) {
      addNotification({
        type: 'error',
        message: handleApiError(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      addNotification({
        type: 'success',
        message: 'Logged out successfully'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-12">
          Your Profile
        </h1>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          {/* Avatar */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.username}
            </h2>
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Mail className="text-gray-400" size={20} />
                <span className="text-gray-900 dark:text-gray-100">{user?.email}</span>
              </div>
            </div>

            {/* Username */}
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {formData.username}
                </div>
              </div>
            )}

            {/* Bio */}
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 min-h-[100px]">
                  {formData.bio || 'No bio added yet'}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold rounded-lg transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Your Meditation Stats
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.totalSessions || 0}</p>
                <p className="text-gray-600 dark:text-gray-400">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.totalMinutes || 0}</p>
                <p className="text-gray-600 dark:text-gray-400">Minutes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.avgDuration || 0}s</p>
                <p className="text-gray-600 dark:text-gray-400">Avg Duration</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}