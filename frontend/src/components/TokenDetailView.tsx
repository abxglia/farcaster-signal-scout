import React from 'react';
import { TokenDetail, signalsAPI } from '../services/signalsAPI';
import { SubscriptionToggle } from './SubscriptionToggle';
import { AlertsLog } from './AlertsLog';

interface TokenDetailViewProps {
  token: TokenDetail;
  onBack: () => void;
  isInWatchlist: boolean;
  onWatchlistToggle: (symbol: string) => void;
  onTrackView: (symbol: string) => void;
  fid?: number; // Farcaster ID for subscriptions
}

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  onBack,
  isInWatchlist,
  onWatchlistToggle,
  onTrackView,
  fid = 1 // Default FID for demo purposes
}) => {
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [threshold, setThreshold] = React.useState(5);

  React.useEffect(() => {
    onTrackView(token.symbol);
  }, [token.symbol]); // Removed onTrackView from dependencies to prevent infinite loop

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

  const getSignalStrength = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue > 5) return 'Very Strong';
    if (absValue > 3) return 'Strong';
    if (absValue > 1) return 'Moderate';
    return 'Weak';
  };

  // Get top 3 driver contributions
  const topDrivers = React.useMemo(() => {
    const drivers = [
      { name: 'Social Volume', value: token.hx_buzz6 || 0, description: 'Social volume change' },
      { name: 'Market Volume', value: token.hx_liq6 || 0, description: 'Market volume change' },
      { name: 'AltRank Change', value: token.hx_rankimp6 || 0, description: 'AltRank change (negated)' },
      { name: 'Sentiment Change', value: token.hx_sent6 || 0, description: 'Sentiment change' },
      { name: 'Galaxy Change', value: token.hx_galchg6 || 0, description: 'Galaxy composite change' },
      { name: 'Realized Return', value: token.hx_ret6 || 0, description: 'Realized return last 6h' }
    ];

    return drivers
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3);
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => onWatchlistToggle(token.symbol)}
          className={`p-2 rounded-lg transition-colors ${
            isInWatchlist 
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
          }`}
        >
          {isInWatchlist ? '★ Watchlist' : '☆ Add to Watchlist'}
        </button>
      </div>

      {/* Token Header */}
      <div className="bg-slate-800/80 rounded-xl p-6 mb-6 border border-slate-700/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl">
            {token.symbol}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{token.symbol}</h1>
            <span className={`text-sm px-3 py-1 rounded-full ${
              token.type === 'memecoin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {token.type}
            </span>
          </div>
        </div>

        <p className="text-slate-300 text-lg">{token.description}</p>
      </div>

      {/* Main Signal */}
      <div className="bg-slate-800/80 rounded-xl p-6 mb-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4">6h Momentum</h2>
        <div className="text-center">
          <div className={`text-5xl font-bold ${getSignalColor(token.hx_mom6)} mb-2`}>
            {token.hx_mom6 > 0 ? '+' : ''}{token.hx_mom6.toFixed(2)}%
          </div>
          <div className="text-slate-400">
            {getSignalStrength(token.hx_mom6)} Signal
          </div>
        </div>
      </div>

      {/* Top 3 Driver Contributions */}
      <div className="bg-slate-800/80 rounded-xl p-6 mb-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Top 3 Signal Drivers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topDrivers.map((driver, index) => (
            <div key={driver.name} className={`p-4 rounded-xl ${getSignalBgColor(driver.value)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-400">#{index + 1}</h3>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  Math.abs(driver.value) > 3 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-500/20 text-slate-300'
                }`}>
                  {Math.abs(driver.value) > 3 ? 'High Impact' : 'Moderate'}
                </div>
              </div>
              <div className="text-lg font-bold text-slate-200 mb-1">
                {driver.name}
              </div>
              <div className={`text-2xl font-bold ${getSignalColor(driver.value)} mb-2`}>
                {driver.value > 0 ? '+' : ''}{driver.value.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">
                {driver.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signal Drivers Grid - Only available metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${getSignalBgColor(token.hx_buzz6)}`}>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Social Volume</h3>
          <div className={`text-2xl font-bold ${getSignalColor(token.hx_buzz6)}`}>
            {isNumber(token.hx_buzz6) ? `${token.hx_buzz6 > 0 ? '+' : ''}${token.hx_buzz6.toFixed(1)}%` : '-'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Social volume change
          </div>
        </div>

        <div className={`p-4 rounded-xl ${getSignalBgColor(token.hx_liq6)}`}>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Market Volume</h3>
          <div className={`text-2xl font-bold ${getSignalColor(token.hx_liq6)}`}>
            {isNumber(token.hx_liq6) ? `${token.hx_liq6 > 0 ? '+' : ''}${token.hx_liq6.toFixed(1)}%` : '-'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Market volume change
          </div>
        </div>

        <div className={`p-4 rounded-xl ${getSignalBgColor(token.hx_rankimp6)}`}>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">AltRank Change</h3>
          <div className={`text-2xl font-bold ${getSignalColor(token.hx_rankimp6)}`}>
            {isNumber(token.hx_rankimp6) ? `${token.hx_rankimp6 > 0 ? '+' : ''}${token.hx_rankimp6.toFixed(1)}` : '-'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            AltRank change (negated)
          </div>
        </div>

        <div className={`p-4 rounded-xl ${getSignalBgColor(token.hx_sent6)}`}>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Sentiment Change</h3>
          <div className={`text-2xl font-bold ${getSignalColor(token.hx_sent6)}`}>
            {isNumber(token.hx_sent6) ? `${token.hx_sent6 > 0 ? '+' : ''}${token.hx_sent6.toFixed(1)}%` : '-'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sentiment change
          </div>
        </div>
      </div>

      {/* Market Data - Not available from database */}

      {/* Social Metrics */}
      <div className="bg-slate-800/80 rounded-xl p-6 mb-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Social Metrics</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm text-slate-400">Contributors Change</div>
            <div className="text-xl font-bold text-white">{isNumber(token.contributors_active) ? `${token.contributors_active > 0 ? '+' : ''}${token.contributors_active.toFixed(1)}%` : '-'}</div>
          </div>
        </div>
      </div>

      {/* Subscription Toggle */}
      <div className="mb-6">
        <SubscriptionToggle
          token={token.symbol}
          fid={fid}
          onSubscriptionChange={(subscribed) => {
            setIsSubscribed(subscribed);
            // Update threshold from subscription if available
            if (subscribed) {
              const userSubs = signalsAPI.getUserSubscriptions(fid);
              const tokenSub = userSubs.find(sub => sub.token === token.symbol.toUpperCase());
              if (tokenSub) {
                setThreshold(tokenSub.threshold);
              }
            }
          }}
        />
      </div>

      {/* Alerts Log */}
      <div className="mb-6">
        <AlertsLog
          token={token.symbol}
          threshold={threshold}
          isSubscribed={isSubscribed}
        />
      </div>

      {/* Social Links */}
      {token.social_links && (
        <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4">Social Links</h2>
          <div className="flex gap-3">
            {token.social_links.twitter && (
              <a
                href={token.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
              >
                Twitter
              </a>
            )}
            {token.social_links.telegram && (
              <a
                href={token.social_links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors"
              >
                Telegram
              </a>
            )}
            {token.social_links.discord && (
              <a
                href={token.social_links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
              >
                Discord
              </a>
            )}
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-white font-semibold transition-colors"
              >
                Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
