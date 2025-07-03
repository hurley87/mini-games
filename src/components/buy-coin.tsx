'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  parseEther,
  formatEther,
  createPublicClient,
  createWalletClient,
  http,
  Address,
  Account,
} from 'viem';
import { base } from 'viem/chains';
// Note: tradeCoin is not available in the current SDK version (0.2.5)
// import { tradeCoin } from '@zoralabs/coins-sdk';
import { Wallet, Copy, Check } from 'lucide-react';
import { tradeCoin } from '@zoralabs/coins-sdk';

interface BuyCoinProps {
  coinAddress: string;
  coinSymbol: string;
  coinName: string;
  amount: string;
  onSuccess?: () => void;
}

export default function BuyCoin({
  coinAddress,
  coinSymbol,
  coinName,
  amount,
  onSuccess,
}: BuyCoinProps) {
  const { user, login, ready, linkWallet } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [showFundingDialog, setShowFundingDialog] = useState(false);
  const [rpcUrl, setRpcUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const isLoggedIn = ready && user;
  const isWalletConnected = ready && user?.wallet?.address;
  const walletAddress = user?.wallet?.address as Address;

  console.log('user', user);
  console.log('coinName', coinName);

  // Fetch RPC URL
  useEffect(() => {
    const fetchRpcUrl = async () => {
      try {
        const response = await fetch('/api/rpc-url');
        if (response.ok) {
          const data = await response.json();
          setRpcUrl(data.rpcUrl);
        }
      } catch (error) {
        console.error('Error fetching RPC URL:', error);
      }
    };

    fetchRpcUrl();
  }, []);

  // Fetch ETH balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || !rpcUrl) return;

      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(rpcUrl),
        });

        const balance = await publicClient.getBalance({
          address: walletAddress,
        });

        setEthBalance(formatEther(balance));
      } catch (error) {
        console.error('Error fetching ETH balance:', error);
        setEthBalance('0');
      }
    };

    fetchBalance();
  }, [walletAddress, rpcUrl]);

  const handleBuy = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!rpcUrl) {
      toast.error('Unable to connect to network');
      return;
    }

    const amountInEth = parseFloat(amount);
    const currentBalance = parseFloat(ethBalance);

    // Check if user has enough balance
    if (currentBalance < amountInEth) {
      setShowFundingDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });

      const walletClient = createWalletClient({
        account: walletAddress,
        chain: base,
        transport: http(rpcUrl),
      });

      // TODO: Implement trading functionality when tradeCoin is available in SDK
      // Placeholder implementation for now
      const receipt = await tradeCoin({
        tradeParameters: {
          sell: { type: 'eth' },
          buy: {
            type: 'erc20',
            address: coinAddress as Address,
          },
          amountIn: parseEther(amount),
          slippage: 0.05, // 5% slippage tolerance
          sender: walletAddress,
        },
        walletClient,
        account: walletAddress as unknown as Account,
        publicClient,
      });

      console.log('Receipt:', receipt);
      console.log('Trade parameters:', {
        sell: { type: 'eth' },
        buy: {
          type: 'erc20',
          address: coinAddress as Address,
        },
        amountIn: parseEther(amount),
        slippage: 0.05, // 5% slippage tolerance
        sender: walletAddress,
      });

      toast.success(`Demo: Trading functionality coming soon! (${coinSymbol})`);

      // Refresh balance
      const newBalance = await publicClient.getBalance({
        address: walletAddress,
      });
      setEthBalance(formatEther(newBalance));

      onSuccess?.();
    } catch (error) {
      console.error('Error buying coin:', error);
      toast.error('Failed to buy coin. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleLinkWallet = async () => {
    try {
      await linkWallet();
    } catch (error) {
      console.error('Error linking wallet:', error);
      toast.error('Failed to link wallet');
    }
  };

  const handleCopyAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      toast.success('Wallet address copied to clipboard!');

      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying address:', error);
      toast.error('Failed to copy address');
    }
  };

  // If user is not logged in, show connect button
  if (!isLoggedIn) {
    return (
      <Button
        onClick={handleConnectWallet}
        className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  // If user is logged in but doesn't have a wallet linked, show link wallet button
  if (isLoggedIn && !isWalletConnected) {
    return (
      <Button
        onClick={handleLinkWallet}
        className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Link EOA Wallet
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleBuy}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Buying...' : 'Buy'}
      </Button>

      {/* Funding Dialog */}
      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#30363d] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Insufficient Balance
            </DialogTitle>
            <DialogDescription className="text-[#adadad]">
              You need {amount} ETH to complete this purchase, but you only have{' '}
              {parseFloat(ethBalance).toFixed(6)} ETH in your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
              <h4 className="font-medium mb-2">Your Wallet Address</h4>
              <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded border border-[#30363d]">
                <code className="text-xs text-[#c9d1d9] font-mono break-all select-all flex-1 pr-2">
                  {walletAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="p-1 h-8 w-8 hover:bg-[#30363d] text-[#c9d1d9] hover:text-white"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
