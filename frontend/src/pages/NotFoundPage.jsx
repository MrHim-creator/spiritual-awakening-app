import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white mb-4">404</h1>
        <h2 className="text-4xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-xl text-purple-100 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/"
            className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition border-2 border-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}