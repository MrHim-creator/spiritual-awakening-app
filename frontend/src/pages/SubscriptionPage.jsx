import React, { useEffect, useState } from 'react';
import { Check, X, Loader } from 'lucide-react';
import { useAuthStore, useAppStore, useSubscriptionStore } from '../store';
import { subscriptionAPI, handleApiError } from '../api';

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const { currentSubscription, setCurrentSubscription } = useSubscriptionStore();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const plansRes = await subscriptionAPI.getPlans();
      setPlans(plansRes.plans);

      const statusRes = await subscriptionAPI.getStatus();
      setCurrentSubscription(statusRes);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to load subscription data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateFree = async () => {
    setProcessingPlan('free');
    try {
      await subscriptionAPI.activateFree();
      addNotification({
        type: 'success',
        message: 'Free plan activated!'
      });
      const statusRes = await subscriptionAPI.getStatus();
      setCurrentSubscription(statusRes);
    } catch (error) {
      addNotification({
        type: 'error',
        message: handleApiError(error)
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleUpgradeToPremium = async () => {
    setProcessingPlan('premium');
    try {
      await subscriptionAPI.upgradeToPremium();
      addNotification({
        type: 'success',
        message: 'Premium activated! (Free during development)'
      });
      const statusRes = await subscriptionAPI.getStatus();
      setCurrentSubscription(statusRes);
    } catch (error) {
      addNotification({
        type: 'error',
        message: handleApiError(error)
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!window.confirm('Are you sure you want to downgrade to the free plan?')) return;

    try {
      await subscriptionAPI.downgradeToFree();
      addNotification({
        type: 'success',
        message: 'Downgraded to free plan'
      });
      const statusRes = await subscriptionAPI.getStatus();
      setCurrentSubscription(statusRes);
    } catch (error) {
      addNotification({
        type: 'error',
        message: handleApiError(error)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading plans...</p>
        </div>
      </div>
    );
  }

  const isPremium = currentSubscription?.isPremium;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Path 🙏
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Both plans are completely free while we build. Upgrade anytime to unlock all features.
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentSubscription?.subscription && (
          <div className={`mb-12 p-6 rounded-lg border-l-4 ${
            isPremium
              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-500'
              : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  isPremium 
                    ? 'text-yellow-900 dark:text-yellow-200' 
                    : 'text-blue-900 dark:text-blue-200'
                }`}>
                  {isPremium ? '👑 You have Premium' : '⭐ You have Free Plan'}
                </h2>
                <p className={isPremium 
                  ? 'text-yellow-800 dark:text-yellow-300' 
                  : 'text-blue-800 dark:text-blue-300'
                }>
                  {isPremium 
                    ? 'Enjoy unlimited access to all features' 
                    : 'Enjoy all basic features. Upgrade anytime!'}
                </p>
              </div>
              {isPremium && (
                <button
                  onClick={handleDowngradeToFree}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  Downgrade
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
            !isPremium
              ? 'ring-4 ring-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
              : 'bg-white dark:bg-gray-800'
          }`}>
            {/* Header */}
            <div className={`p-8 ${
              !isPremium
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <h2 className={`text-2xl font-bold ${
                !isPremium ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                Free Plan
              </h2>
            </div>

            {/* Price */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="text-5xl font-bold text-blue-600">R0</div>
              <div className="text-gray-600 dark:text-gray-400">Forever free</div>
            </div>

            {/* Features */}
            <div className="p-8">
              <ul className="space-y-4">
                {[
                  'Access to free quotes',
                  'Basic nature sounds (3)',
                  'Limited Solfeggio (3 frequencies)',
                  'Save up to 5 favorites',
                  'Basic meditation tracking',
                  'See ads'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Button */}
            <div className="p-8 border-t border-gray-200 dark:border-gray-700">
              {!isPremium ? (
                <button disabled className="w-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 py-3 rounded-lg font-bold cursor-not-allowed">
                  ✓ Your Current Plan
                </button>
              ) : (
                <button
                  onClick={handleActivateFree}
                  disabled={processingPlan === 'free'}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPlan === 'free' ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Get Started (Free)'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
            isPremium
              ? 'ring-4 ring-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
              : 'bg-white dark:bg-gray-800'
          }`}>
            {/* Header */}
            <div className={`p-8 ${
              isPremium
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <h2 className={`text-2xl font-bold ${
                isPremium ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                Premium Plan
              </h2>
              <p className="text-sm text-purple-100 mt-2">FREE during development</p>
            </div>

            {/* Price */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="text-5xl font-bold text-purple-600">R0</div>
              <div className="text-gray-600 dark:text-gray-400">Free while building</div>
              <p className="text-sm text-gray-500 mt-2">Later: R499/month (your choice)</p>
            </div>

            {/* Features */}
            <div className="p-8">
              <ul className="space-y-4">
                {[
                  'All quotes (25+)',
                  'All 8 Solfeggio frequencies',
                  'All nature sounds (6)',
                  'Unlimited favorites',
                  'Full meditation tracking',
                  'No ads',
                  'Download for offline',
                  'Priority support'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Button */}
            <div className="p-8 border-t border-gray-200 dark:border-gray-700">
              {isPremium ? (
                <button disabled className="w-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 py-3 rounded-lg font-bold cursor-not-allowed">
                  ✓ Your Current Plan
                </button>
              ) : (
                <button
                  onClick={handleUpgradeToPremium}
                  disabled={processingPlan === 'premium'}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPlan === 'premium' ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    'Upgrade to Premium'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-12">
          <h2 className="text-2xl font-bold p-8 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-8 py-4 text-left font-bold text-gray-900 dark:text-white">Feature</th>
                  <th className="px-8 py-4 text-center font-bold text-gray-900 dark:text-white">Free</th>
                  <th className="px-8 py-4 text-center font-bold text-gray-900 dark:text-white">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Free Quotes', free: true, premium: true },
                  { name: 'Premium Quotes', free: false, premium: true },
                  { name: 'Solfeggio Frequencies', free: '3 only', premium: 'All 8' },
                  { name: 'Nature Sounds', free: '3 sounds', premium: 'All 6' },
                  { name: 'Save Favorites', free: 'Max 5', premium: 'Unlimited' },
                  { name: 'Meditation Tracking', free: true, premium: true },
                  { name: 'Ad-Free', free: false, premium: true },
                  { name: 'Download for Offline', free: false, premium: true },
                  { name: 'Priority Support', free: false, premium: true },
                  { name: 'Current Cost', free: 'R0', premium: 'R0 (later R499/month)' }
                ].map((feature, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}>
                    <td className="px-8 py-4 font-medium text-gray-900 dark:text-white">{feature.name}</td>
                    <td className="px-8 py-4 text-center">
                      {feature.free === true ? (
                        <Check className="text-green-600 mx-auto" size={20} />
                      ) : feature.free === false ? (
                        <X className="text-gray-400 mx-auto" size={20} />
                      ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature.free}</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-center">
                      {feature.premium === true ? (
                        <Check className="text-green-600 mx-auto" size={20} />
                      ) : (
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{feature.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 p-6 rounded-lg text-blue-900 dark:text-blue-100">
          <h3 className="font-bold mb-2">💡 Early Adopter Benefits</h3>
          <p>
            All users who upgrade to Premium now get <strong>lifetime free access</strong> (or grandfathered pricing when payments are introduced). No payment needed yet!
          </p>
        </div>
      </div>
    </div>
  );
}