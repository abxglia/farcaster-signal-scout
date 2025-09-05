import React, { useState, useEffect } from 'react';
import { signalsAPI } from '../services/signalsAPI';

interface SignalScoutNFTProps {
  fid: number;
  isConnected: boolean;
  onMintNFT?: () => void;
}

export const SignalScoutNFT: React.FC<SignalScoutNFTProps> = ({
  fid,
  isConnected,
  onMintNFT
}) => {
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (isConnected) {
      updateSubscriptionStatus();
      // subscribe to changes
      const off = signalsAPI.onSubscriptionsChanged(() => {
        updateSubscriptionStatus();
      });
      return () => off();
    }
  }, [fid, isConnected]);

  const updateSubscriptionStatus = () => {
    const userSubscriptions = signalsAPI.getUserSubscriptions(fid);
    const count = userSubscriptions.length;
    setSubscriptionCount(count);
    setIsEligible(count >= 3);
  };

  const handleMintNFT = async () => {
    if (!isEligible || isMinting) return;
    
    setIsMinting(true);
    try {
      // Call the on-chain mint function
      onMintNFT?.();
      
      // Update local state
      setIsEligible(false);
    } catch (error) {
      console.error('Error minting Signal Scout NFT:', error);
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">🎯</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">Signal Scout NFT</h2>
          <p className="text-slate-600 text-sm">Awarded for keeping 3+ token subscriptions</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Active Subscriptions</span>
          <span className="text-lg font-bold">{subscriptionCount}/3</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((subscriptionCount / 3) * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-slate-600">
          {subscriptionCount < 3 
            ? `${3 - subscriptionCount} more subscription${3 - subscriptionCount === 1 ? '' : 's'} needed`
            : 'Eligible for Signal Scout NFT!'
          }
        </div>
      </div>

      {isEligible ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-semibold">Eligible!</span>
            </div>
            <div className="text-sm text-green-700">
              You've maintained 3+ token subscriptions. Claim your Signal Scout NFT!
            </div>
          </div>
          
          <button
            onClick={handleMintNFT}
            disabled={isMinting}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMinting ? 'Minting NFT...' : '🎯 Mint Signal Scout NFT'}
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-700 mb-2">
            <strong>How to earn:</strong>
          </div>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Subscribe to 3+ different tokens</li>
            <li>• Keep subscriptions active</li>
            <li>• Monitor threshold alerts</li>
            <li>• Claim your Signal Scout NFT</li>
          </ul>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-600">
        💡 Signal Scout NFTs recognize users who actively monitor multiple token signals
      </div>
    </div>
  );
};
