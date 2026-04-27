import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, BookOpen, Zap, TrendingUp, Heart, Play } from 'lucide-react';
import { useAuthStore, useQuoteStore, useAudioStore, useSubscriptionStore } from '../store';
import { quotesAPI, audioAPI, subscriptionAPI } from '../api';
import AudioPlayer from '../components/AudioPlayer';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentQuote, favorites, setCurrentQuote, setFavorites } = useQuoteStore();
  const { stats, setStats, audioLibrary, setAudioLibrary } = useAudioStore();
  const { currentSubscription, setCurrentSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load quote
      const quoteRes = await quotesAPI.getRandomQuote();
      setCurrentQuote(quoteRes.quote);

      // Load favorites
      const favRes = await quotesAPI.getUserFavorites();
      setFavorites(favRes.favorites);

      // Load audio library
      const audioRes = await audioAPI.getLibrary();
      setAudioLibrary(audioRes.audio);

      // Load audio stats
      const statsRes = await audioAPI.getStats();
      setStats(statsRes.stats);

      // Load subscription status
      const subRes = await subscriptionAPI.getStatus();
      setCurrentSubscription(subRes);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // All users have premium features - no restrictions
  const isPremium = true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🙏</div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.username}! 🙏
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your spiritual journey continues...
          </p>
        </div>

        {/* Welcome Banner - All Users Have Full Access */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-green-500 rounded-lg">
          <div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-200">
              ✨ Welcome to Your Spiritual Journey
            </h3>
            <p className="text-green-800 dark:text-green-300">
              You have full access to all features: unlimited quotes, all Solfeggio frequencies, all nature sounds, and more!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Meditation Sessions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalSessions || 0}
                </p>
              </div>
              <Music className="text-purple-600 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Minutes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalMinutes || 0}
                </p>
              </div>
              <TrendingUp className="text-blue-600 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Favorite Quotes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {favorites?.length || 0}
                </p>
              </div>
              <Heart className="text-red-600 opacity-50" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.avgDuration || 0}s
                </p>
              </div>
              <Zap className="text-yellow-600 opacity-50" size={40} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Daily Quote */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Today's Inspiration
            </h2>
            {currentQuote && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-8 rounded-lg border-l-4 border-purple-600">
                <p className="text-2xl md:text-3xl font-serif italic text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
                  "{currentQuote.text}"
                </p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  — {currentQuote.author}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {currentQuote.category && `Category: ${currentQuote.category}`}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    Save
                  </button>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="space-y-4">
              <Link
                to="/subscription"
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Music size={20} className="text-purple-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Meditation</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start a meditation session
                </p>
              </Link>

              <Link
                to="/subscription"
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={20} className="text-red-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">My Favorites</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View your saved quotes
                </p>
              </Link>

              <Link
                to="/profile"
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={20} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Profile</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Edit your account
                </p>
              </Link>

              <Link
                to="/subscription"
                className="block p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={20} />
                  <h3 className="font-bold">Premium Features</h3>
                </div>
                <p className="text-sm opacity-90">
                  Unlock all content
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* AUDIO PLAYER SECTION */}
        <div className="mb-12">
          <AudioPlayer />
        </div>

        {/* Recent Activity */}
        {favorites && favorites.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Your Favorite Quotes
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {favorites.slice(0, 4).map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                    "{quote.text.substring(0, 100)}..."
                  </p>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    — {quote.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}