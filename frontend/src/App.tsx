// App.tsx
// Main React component for the Top Signals Browser (SocialFi/Analytics) Mini-App.
// This file implements the signals browser with token analysis, watchlist, and Researcher NFT functionality.

import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ethers } from "ethers";
import TopSignalsBrowserAbi from "./abi/TopSignalsBrowser.json";

// Address of the deployed Top Signals Browser contract
// Update this after deploying your own contract
const CONTRACT_ADDRESS = "0xaeac28d4881f1f6ee3d9014d2c34ba856c039b8a"; // TODO: Update with deployed address

import { signalsAPI, TokenSignal, TokenDetail } from "./services/signalsAPI";
import { TokenSignalCard } from "./components/TokenSignalCard";
import { TokenDetailView } from "./components/TokenDetailView";
import { ResearcherNFT } from "./components/ResearcherNFT";
import { SignalScoutNFT } from "./components/SignalScoutNFT";

type View = 'list' | 'detail' | 'watchlist';

export default function App() {
  // Ethers setup
  const RPC_URL = (import.meta as any).env.VITE_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
  const publicProvider = new ethers.JsonRpcProvider(RPC_URL);
  const publicContract = new ethers.Contract(CONTRACT_ADDRESS, TopSignalsBrowserAbi as any, publicProvider);

  // App state for connection and contract interactions
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMinted, setIsMinted] = useState(false);

  // App state
  const [currentView, setCurrentView] = useState<View>('list');
  const [signalsDirection, setSignalsDirection] = useState<'gainers' | 'losers'>('gainers');
  const [tokens, setTokens] = useState<TokenSignal[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [counterValue, setCounterValue] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(10);
  const [isAtMilestone, setIsAtMilestone] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Auto-connect on refresh and react to account changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    let isMounted = true;

    const init = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(eth);
        const accounts: string[] = await browserProvider.send('eth_accounts', []);
        if (isMounted && accounts && accounts.length > 0) {
          const sign = await browserProvider.getSigner();
          const addr = await sign.getAddress();
          setSigner(sign);
          setAddress(addr);
          setIsConnected(true);
          fetchContractData();
        }
      } catch (e) {
        console.error('Auto-connect failed:', e);
      }
    };

    const handleAccountsChanged = async (accs: string[]) => {
      if (!accs || accs.length === 0) {
        setIsConnected(false);
        setSigner(null);
        setAddress(null);
        return;
      }
      try {
        const browserProvider = new ethers.BrowserProvider(eth);
        const sign = await browserProvider.getSigner();
        const addr = await sign.getAddress();
        setSigner(sign);
        setAddress(addr);
        setIsConnected(true);
      } catch (e) {
        console.error('accountsChanged handler failed:', e);
      }
    };

    init();
    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('disconnect', () => {
      setIsConnected(false);
      setSigner(null);
      setAddress(null);
    });

    return () => {
      isMounted = false;
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // Fetch contract data
  const fetchContractData = async () => {
    try {
      const counter = await publicContract.getCounter();
      setCounterValue(Number(counter));

      const next = await publicContract.getNextCounterMilestone();
      setNextMilestone(Number(next));

      const isAt = await publicContract.isCounterMultipleOfTen();
      setIsAtMilestone(isAt);

      if (address) {
        const balance = await publicContract.balanceOf(address);
        setHasNFT(balance > 0n);
      }
    } catch (err) {
      console.error('Error fetching contract data:', err);
    }
  };

  useEffect(() => {
    fetchContractData();
    const interval = setInterval(fetchContractData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [address]);

  // Load tokens based on current view
  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true);
      try {
        let tokensData: TokenSignal[] = [];
        
        tokensData = await signalsAPI.getTopSignals(signalsDirection);
        
        setTokens(tokensData);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setTokens([]);
      }
      setLoading(false);
    };

    loadTokens();
  }, [currentView, signalsDirection]);

  // Connect wallet
  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setError(new Error('No wallet detected'));
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const sign = await browserProvider.getSigner();
      const addr = await sign.getAddress();
      setSigner(sign);
      setAddress(addr);
      setIsConnected(true);
      fetchContractData(); // Refresh data on connect
    } catch (err) {
      setError(err as Error);
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // No detail navigation; main page only

  // Remove watchlist functionality

  // Track token interaction (frontend analytics only; no on-chain write here)
  const handleTrackView = async (symbol: string) => {
    await signalsAPI.trackTokenView(symbol);
  };

  // Mint NFT at milestone
  const handleMintNFT = async () => {
    if (!isConnected || !signer) return;

    setIsPending(true);
    setIsMinted(false);
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, TopSignalsBrowserAbi as any, signer);
      const tx = await contractWithSigner.mintNftAtMilestone({ value: 0n });
      setTxHash(tx.hash);
      setIsConfirming(true);
      const receipt = await tx.wait();
      setIsConfirming(false);
      if (receipt.status === 1) {
        setIsMinted(true);
        fetchContractData();
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  // Mint Signal Scout NFT
  const handleMintSignalScoutNFT = async () => {
    if (!isConnected || !signer) return;

    setIsPending(true);
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, TopSignalsBrowserAbi as any, signer);
      const tx = await contractWithSigner.mintSignalScoutNft({ value: 0n });
      setTxHash(tx.hash);
      setIsConfirming(true);
      const receipt = await tx.wait();
      setIsConfirming(false);
      if (receipt.status === 1) {
        fetchContractData();
      }
    } catch (error) {
      console.error('Error minting Signal Scout NFT:', error);
      setError(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  // On-chain subscribe helper
  const handleOnChainSubscribe = async (fid: number, token: string, threshold: number) => {
    if (!isConnected || !signer) return;
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, TopSignalsBrowserAbi as any, signer);
      // subscribeToToken(uint256 _fid, string _token, uint256 _threshold)
      const tx = await contractWithSigner.subscribeToToken(fid, token, BigInt(threshold));
      await tx.wait();
      // optional: refresh any contract data if needed
    } catch (e) {
      console.error('subscribeToToken failed:', e);
      throw e;
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setCurrentView('list');
    setSelectedToken(null);
  };

  // Share to Farcaster
  const handleShare = () => {
    const message = selectedToken
      ? `I just analyzed ${selectedToken.symbol} on Top Signals Browser! 📊 Signal: ${selectedToken.hx_mom6 > 0 ? '+' : ''}${selectedToken.hx_mom6.toFixed(2)}%`
      : `I'm exploring top crypto signals on Top Signals Browser! ⚡ Global counter: ${counterValue}`;

    sdk.actions.composeCast({
      text: message,
    });
  };

  // No detail route in simplified UI

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="bg-white/90 border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Signal Scout</h1>
            </div>
            
            {!isConnected ? (
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                disabled={isConnecting}
                onClick={connectWallet}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-700 text-sm font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Minimal hero */}
        <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-5">
          <div className="text-lg md:text-xl font-semibold tracking-tight">6h Momentum Signals</div>
          <div className="text-slate-600 text-sm md:text-base">Track liquidity, social buzz, and rank with a clean, focused view.</div>
        </div>
        {/* Navigation removed - single list view */}

        {/* Direction Tabs */}
        {(
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSignalsDirection('gainers')}
              className={`px-3 py-2 rounded-md font-semibold transition-colors border ${
                signalsDirection === 'gainers' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ↑ Top Gainers
            </button>
            <button
              onClick={() => setSignalsDirection('losers')}
              className={`px-3 py-2 rounded-md font-semibold transition-colors border ${
                signalsDirection === 'losers' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ↓ Top Losers
            </button>
          </div>
        )}

        {/* NFT Section */}
        {isConnected && (
          <div className="mb-6 space-y-4">
            {/* <ResearcherNFT
              counterValue={counterValue}
              nextMilestone={nextMilestone}
              isAtMilestone={isAtMilestone}
              hasNFT={hasNFT}
              onMintNFT={handleMintNFT}
              isLoading={isPending || isConfirming}
            /> */}
            <SignalScoutNFT
              fid={1} // TODO: Get actual FID from Farcaster SDK
              isConnected={isConnected}
              onMintNFT={handleMintSignalScoutNFT}
            />
          </div>
        )}

        {/* Tokens Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-blue-600 text-lg">Loading signals...</div>
          </div>
        ) : tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tokens.map((token) => (
              <TokenSignalCard
                key={token.symbol}
                token={token}
                fid={1}
                onChainSubscribe={handleOnChainSubscribe}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-600 text-lg">
              {currentView === 'watchlist' 
                ? 'Your watchlist is empty. Add tokens from the signals list!' 
                : 'No signals available at the moment.'
              }
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 font-semibold">Error</div>
            <div className="text-red-700/80 text-sm">{error.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}