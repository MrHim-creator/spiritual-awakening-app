import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from './store';
import { authAPI, healthAPI } from './api';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const { user, token, hydrate } = useAuthStore();
  const { hydrateTheme } = useAppStore();

  // Initialize app
  useEffect(() => {
    hydrate();
    hydrateTheme();
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await healthAPI.check();
      console.log('✓ Backend is running');
    } catch (error) {
      console.error('✗ Backend connection failed:', error);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    return token && user ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;