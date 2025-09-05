import React from 'react';
import { TokenSignal, signalsAPI } from '../services/signalsAPI';

interface TokenSignalCardProps {
  token: TokenSignal;
  fid: number;
  onChainSubscribe?: (fid: number, token: string, threshold: number) => Promise<void>;
}

export const TokenSignalCard: React.FC<TokenSignalCardProps> = ({
  token,
  fid,
  onChainSubscribe
}) => {
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const defaultThreshold = 5;

  React.useEffect(() => {
    setIsSubscribed(signalsAPI.isSubscribedToToken(fid, token.symbol));
  }, [fid, token.symbol]);

  const handleToggleSubscribe = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const sub = signalsAPI.getUserSubscriptions(fid).find(s => s.token === token.symbol.toUpperCase());
        if (sub) signalsAPI.removeSubscription(fid, sub.id);
        setIsSubscribed(false);
      } else {
        if (onChainSubscribe) {
          try {
            await onChainSubscribe(fid, token.symbol, defaultThreshold);
          } catch (e) {
            console.error('On-chain subscribe failed, falling back to local:', e);
          }
        }
        signalsAPI.addSubscription(fid, token.symbol, defaultThreshold);
        setIsSubscribed(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const isNumber = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);

  const formatNumber = (num?: number): string => {
    if (!isNumber(num)) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price?: number): string => {
    if (!isNumber(price)) return '-';
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getSignalColor = (value?: number): string => {
    if (!isNumber(value)) return 'text-gray-400';
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSignalBgColor = (value?: number): string => {
    if (!isNumber(value)) return 'bg-gray-500/20';
    if (value > 0) return 'bg-green-500/20';
    if (value < 0) return 'bg-red-500/20';
    return 'bg-gray-500/20';
  };

  return (
    <div 
      className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-400/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-base leading-tight mr-1">{token.symbol}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{token.type}</span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleSubscribe();
          }}
          disabled={isLoading}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
            isSubscribed 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? '...' : (isSubscribed ? 'Unsubscribe' : 'Subscribe')}
        </button>
      </div>

      {/* Main Signal */}
      <div className="mb-4">
        <div className={`text-2xl font-extrabold ${getSignalColor(token.hx_mom6)}`}>
          {token.hx_mom6 > 0 ? '+' : ''}{token.hx_mom6.toFixed(2)}%
        </div>
        <div className="text-xs text-slate-500">6h Momentum</div>
      </div>

      {/* Price and Market Data - Not available from database */}

      {/* Signal Drivers (only render cards with data) */}
      <div className="grid grid-cols-3 gap-2">
        {isNumber(token.hx_buzz6) && (
          <div className={`text-center p-2 rounded-md ${getSignalBgColor(token.hx_buzz6)} border border-slate-200`}>
            <div className={`text-xs font-semibold ${getSignalColor(token.hx_buzz6)}`}>
              {token.hx_buzz6! > 0 ? '+' : ''}{token.hx_buzz6!.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500">Buzz</div>
          </div>
        )}
        {isNumber(token.hx_liq6) && (
          <div className={`text-center p-2 rounded-md ${getSignalBgColor(token.hx_liq6)} border border-slate-200`}>
            <div className={`text-xs font-semibold ${getSignalColor(token.hx_liq6)}`}>
              {token.hx_liq6! > 0 ? '+' : ''}{token.hx_liq6!.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500">Liquidity</div>
          </div>
        )}
        {isNumber(token.hx_rankimp6) && (
          <div className={`text-center p-2 rounded-md ${getSignalBgColor(token.hx_rankimp6)} border border-slate-200`}>
            <div className={`text-xs font-semibold ${getSignalColor(token.hx_rankimp6)}`}>
              {token.hx_rankimp6! > 0 ? '+' : ''}{token.hx_rankimp6!.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500">Rank</div>
          </div>
        )}
      </div>

      {/* Social Contributors (available from d_pct_users_6h) */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Social Contributors: {isNumber(token.contributors_active) ? formatNumber(token.contributors_active) : '-'}</span>
        </div>
      </div>
    </div>
  );
};
