import React, { useEffect } from 'react';
import { Check, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  // Notify user on load
  useEffect(() => {
    addNotification({
      type: 'success',
      message: '✨ Welcome! You have full access to all features.'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Completely Free App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Register once and enjoy everything – forever free, no payments needed.
          </p>
        </div>

        {/* Main Message */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-8 rounded-lg border-l-4 border-green-600 mb-12">
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-200 mb-2">
            🎉 Great News!
          </h2>
          <p className="text-green-800 dark:text-green-300 text-lg">
            You have full access to everything on this app. All Solfeggio Frequencies, Nature Sounds, Quotes, and Features are completely free. No ads, no payments, no premium tiers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> Everything Included
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">All 8 Solfeggio Frequencies</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">All Nature Sounds</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">25+ Inspirational Quotes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Unlimited Favorites</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Full Meditation Tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Ad-Free Experience</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔒</span> Security & Privacy
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Secure Authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Password-Protected Account</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Personal Data Stored Safely</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">No Third-Party Tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">HTTPS Encrypted Connection</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <span className="text-gray-700 dark:text-gray-300">Regular Backups</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg border-l-4 border-blue-600 mb-12">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">
            💡 How It Works
          </h2>
          <ol className="space-y-3 text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-3">
              <span className="font-bold text-lg">1.</span>
              <span>Register your account with a username, email, and password</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-lg">2.</span>
              <span>Log in to your account anytime, anywhere</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-lg">3.</span>
              <span>Access all features immediately – nothing to buy or unlock</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-lg">4.</span>
              <span>Enjoy unlimited meditation, quotes, and spiritual content forever</span>
            </li>
          </ol>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border-l-4 border-purple-600 mb-12">
            <p className="text-purple-900 dark:text-purple-200">
              <span className="font-bold">Welcome, {user.username}!</span> You're all set to start your spiritual journey.
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-block px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition"
          >
            Go to Dashboard 🚀
          </Link>
        </div>
      </div>
    </div>
  );
}