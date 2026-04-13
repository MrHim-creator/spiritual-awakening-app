import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Music, TrendingUp } from 'lucide-react';
import { quotesAPI, audioAPI } from '../api';
import { useAuthStore, useQuoteStore, useAudioStore } from '../store';

export default function HomePage() {
  const { user } = useAuthStore();
  const { currentQuote, setCurrentQuote } = useQuoteStore();
  const { audioLibrary, setAudioLibrary } = useAudioStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const quoteRes = await quotesAPI.getRandomQuote();
      setCurrentQuote(quoteRes.quote);

      const audioRes = await audioAPI.getLibrary();
      setAudioLibrary(audioRes.audio);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNewQuote = async () => {
    try {
      setIsLoading(true);
      const res = await quotesAPI.getRandomQuote();
      setCurrentQuote(res.quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Journey to Spiritual Awakening 🙏
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Daily wisdom, meditation sounds, and mindful practices for inner peace
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/subscription"
                  className="px-8 py-3 bg-purple-700 hover:bg-purple-800 font-bold rounded-lg transition border-2 border-white"
                >
                  Upgrade to Premium
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-purple-700 hover:bg-purple-800 font-bold rounded-lg transition border-2 border-white"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Daily Quote Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            ✨ Today's Wisdom
          </h2>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">Loading...</div>
            </div>
          ) : currentQuote ? (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-8 rounded-lg border-l-4 border-purple-600">
              <p className="text-2xl md:text-3xl font-serif italic text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
                "{currentQuote.text}"
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    — {currentQuote.author}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentQuote.category && `Category: ${currentQuote.category}`}
                  </p>
                </div>
                <button
                  onClick={getNewQuote}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  New Quote
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            What We Offer
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                25+ Spiritual Quotes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Wisdom from Confucius, anime characters, and spiritual masters. Daily inspiration for your journey.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Solfeggio & Nature Sounds
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                8 healing frequencies (174Hz-852Hz) and 6 nature sounds for deep meditation and relaxation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Track Your Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your meditation sessions, achievements, and spiritual growth over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Your Spiritual Journey Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Free to use, forever. Premium features available when you're ready.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-block px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
          >
            {user ? 'Go to Dashboard' : 'Get Started Now'}
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600">25+</div>
              <p className="text-gray-600 dark:text-gray-400">Spiritual Quotes</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">8</div>
              <p className="text-gray-600 dark:text-gray-400">Solfeggio Frequencies</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">6</div>
              <p className="text-gray-600 dark:text-gray-400">Nature Sounds</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">∞</div>
              <p className="text-gray-600 dark:text-gray-400">Free Forever</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}