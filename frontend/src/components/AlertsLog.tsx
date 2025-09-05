import React, { useState, useEffect } from 'react';
import { signalsAPI, TokenSignalTick } from '../services/signalsAPI';

interface AlertsLogProps {
  token: string;
  threshold: number;
  isSubscribed: boolean;
}

export const AlertsLog: React.FC<AlertsLogProps> = ({
  token,
  threshold,
  isSubscribed
}) => {
  const [alerts, setAlerts] = useState<TokenSignalTick[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSubscribed) {
      loadAlerts();
    }
  }, [token, threshold, isSubscribed]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const alertsData = await signalsAPI.getAlertsLog(token, threshold);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSignalColor = (value: number): string => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSignalBgColor = (value: number): string => {
    if (value > 0) return 'bg-green-500/20';
    if (value < 0) return 'bg-red-500/20';
    return 'bg-gray-500/20';
  };

  if (!isSubscribed) {
    return (
      <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Alerts Log</h2>
        <div className="text-center py-8">
          <div className="text-slate-400 text-lg mb-2">📊</div>
          <div className="text-slate-400">
            Subscribe to {token} to see threshold breach alerts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Alerts Log</h2>
        <button
          onClick={loadAlerts}
          disabled={isLoading}
          className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-sm transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-cyan-300 text-lg">Loading alerts...</div>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.timestamp}-${index}`}
              className={`p-4 rounded-lg border ${getSignalBgColor(alert.hx_mom6)} border-slate-600/50`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.hx_mom6 > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold text-slate-300">
                    Threshold Breach
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Momentum Signal</div>
                  <div className={`text-lg font-bold ${getSignalColor(alert.hx_mom6)}`}>
                    {alert.hx_mom6 > 0 ? '+' : ''}{alert.hx_mom6.toFixed(2)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-slate-400 mb-1">Threshold</div>
                  <div className="text-lg font-bold text-slate-300">
                    ±{threshold}%
                  </div>
                </div>
              </div>

              {/* Additional signal drivers */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {alert.hx_buzz6 !== undefined && (
                  <div className="text-slate-400">
                    Social: {alert.hx_buzz6 > 0 ? '+' : ''}{alert.hx_buzz6.toFixed(1)}%
                  </div>
                )}
                {alert.hx_liq6 !== undefined && (
                  <div className="text-slate-400">
                    Volume: {alert.hx_liq6 > 0 ? '+' : ''}{alert.hx_liq6.toFixed(1)}%
                  </div>
                )}
                {alert.hx_sent6 !== undefined && (
                  <div className="text-slate-400">
                    Sentiment: {alert.hx_sent6 > 0 ? '+' : ''}{alert.hx_sent6.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-400 text-lg mb-2">🔔</div>
          <div className="text-slate-400">
            No threshold breaches detected yet
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Alerts will appear here when {token} momentum exceeds ±{threshold}%
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        Showing last 4 threshold breaches for {token}
      </div>
    </div>
  );
};
