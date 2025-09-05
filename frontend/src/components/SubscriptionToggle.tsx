import React, { useState, useEffect } from 'react';
import { signalsAPI, TokenSubscription } from '../services/signalsAPI';

interface SubscriptionToggleProps {
  token: string;
  fid: number;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export const SubscriptionToggle: React.FC<SubscriptionToggleProps> = ({
  token,
  fid,
  onSubscriptionChange
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<TokenSubscription | null>(null);

  useEffect(() => {
    // Check if user is already subscribed to this token
    const userSubscriptions = signalsAPI.getUserSubscriptions(fid);
    const existingSubscription = userSubscriptions.find(sub => sub.token === token.toUpperCase());
    
    if (existingSubscription) {
      setIsSubscribed(true);
      setCurrentSubscription(existingSubscription);
      setThreshold(existingSubscription.threshold);
    }
  }, [token, fid]);

  const handleToggleSubscription = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed && currentSubscription) {
        // Unsubscribe
        const success = signalsAPI.removeSubscription(fid, currentSubscription.id);
        if (success) {
          setIsSubscribed(false);
          setCurrentSubscription(null);
          onSubscriptionChange?.(false);
        }
      } else {
        // Subscribe
        const subscription = signalsAPI.addSubscription(fid, token, threshold);
        setCurrentSubscription(subscription);
        setIsSubscribed(true);
        onSubscriptionChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    
    // If already subscribed, update the subscription
    if (isSubscribed && currentSubscription) {
      signalsAPI.removeSubscription(fid, currentSubscription.id);
      const updatedSubscription = signalsAPI.addSubscription(fid, token, newThreshold);
      setCurrentSubscription(updatedSubscription);
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Token Alerts</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            Threshold: {threshold}%
          </span>
          <button
            onClick={handleToggleSubscription}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isSubscribed
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Loading...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
      </div>

      {!isSubscribed && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-400 mb-2">
            Alert Threshold (%)
          </label>
          <div className="flex gap-2">
            {[3, 5, 10, 15].map((value) => (
              <button
                key={value}
                onClick={() => handleThresholdChange(value)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                  threshold === value
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Get alerts when {token} momentum exceeds ±{threshold}%
          </div>
        </div>
      )}

      {isSubscribed && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400 font-semibold">Subscribed</span>
          </div>
          <div className="text-sm text-slate-300">
            You'll receive alerts when {token} momentum exceeds ±{threshold}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Subscription created: {new Date(currentSubscription?.created_at || 0).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        💡 Keep 3+ subscriptions to earn the Signal Scout NFT
      </div>
    </div>
  );
};
