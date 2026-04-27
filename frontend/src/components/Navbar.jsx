import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { useAuthStore, useAppStore, useSubscriptionStore } from '../store';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const { currentSubscription } = useSubscriptionStore();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard', protected: true },
    { label: 'Subscription', path: '/subscription', protected: true },
    { label: 'Profile', path: '/profile', protected: true }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-purple-600">
            <span>🙏</span>
            <span className="hidden sm:inline">Spiritual Awakening</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              (!link.protected || (user && link.protected)) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-gray-700" />
              ) : (
                <Sun size={20} className="text-yellow-400" />
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    ✨ Full Access
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              {isOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {navLinks.map((link) => (
                (!link.protected || (user && link.protected)) && (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}