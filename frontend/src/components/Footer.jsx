import React from 'react';
import { Heart, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-purple-600">Spiritual Awakening</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your daily companion for spiritual growth, meditation, and inner peace through timeless wisdom.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">About</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Features</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Help Center</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Contact Us</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</a></li>
              <li><a href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Terms of Service</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition">
                <Mail size={20} />
              </a>
              <a href="#" className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition">
                <Heart size={20} />
              </a>
              <a href="#" className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition">
                <span className="text-lg">🙏</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {/* Built by */}
          <div className="text-center mb-6">
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
              Built with <span className="text-red-500">❤️</span> by
            </p>
            <p className="text-purple-600 dark:text-purple-400 font-bold text-xl">
              MrHim-Creator South Africa 🇿🇦
            </p>
          </div>

          {/* Bottom info */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {currentYear} Spiritual Awakening App. All rights reserved.</p>
            <p className="mt-4 md:mt-0">
              Version 1.0.0 • Made with passion • Open to the universe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}