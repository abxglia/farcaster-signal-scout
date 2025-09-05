#!/bin/bash

# Deployment script for Top Signals Browser contract
# This script deploys the contract to Arbitrum Sepolia testnet

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

set -e

SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Check for PRIVATE_KEY environment variable
if [[ -z "$PRIVATE_KEY" ]]; then
  echo "Error: PRIVATE_KEY environment variable is not set."
  echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
  exit 1
fi

echo "🚀 Deploying Top Signals Browser contract to Arbitrum Sepolia..."

# Run check against Arbitrum Sepolia RPC instead of localhost
cargo stylus check -e "$SEPOLIA_RPC_URL"

# Export ABI
echo "📄 Exporting ABI..."
cargo stylus export-abi --output ../../frontend/src/abi/TopSignalsBrowser.json

# Deploy to Arbitrum Sepolia
echo "🌐 Deploying to Arbitrum Sepolia..."  
cargo stylus deploy -e "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"

echo "✅ Deployment complete!"
echo "📝 Update CONTRACT_ADDRESS in frontend/src/App.tsx with the deployed address"