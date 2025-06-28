'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Coins, Copy, Check } from 'lucide-react';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';
import { formatEther } from 'viem';

interface CoinRewardsProps {
  coinAddress: string;
  walletAddress: string;
  symbol: string;
}

// Use Base's public RPC endpoint
const RPC_URL =
  'https://greatest-nameless-morning.base-mainnet.quiknode.pro/69dd30f00e9ea35f66f016d444e403c4df57f8bd/';

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// Utility function to format numbers in human-readable format
const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return Math.floor(num / 1_000_000_000) + 'B';
  }
  if (num >= 1_000_000) {
    return Math.floor(num / 1_000_000) + 'M';
  }
  if (num >= 1_000) {
    return Math.floor(num / 1_000) + 'K';
  }
  return Math.floor(num).toString();
};

export default function CoinRewards({
  coinAddress,
  walletAddress,
  symbol,
}: CoinRewardsProps) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || !coinAddress) return;

      try {
        setIsLoading(true);
        const balanceResult = await publicClient.readContract({
          address: coinAddress as Address,
          abi: [
            {
              inputs: [{ name: 'account', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [walletAddress as Address],
        });

        // Format the balance to a readable format (assuming 18 decimals)
        const formattedBalance = formatEther(balanceResult);
        setBalance(formatNumber(parseFloat(formattedBalance)));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [coinAddress, walletAddress]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-10 bg-transparent cursor-pointer"
          variant="outline"
          size="lg"
        >
          <Coins className="w-4 h-4 mr-2" />
          Rewards
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Coin Rewards</DialogTitle>
          <DialogDescription className="text-[#adadad]">
            View your reward pool balance and wallet address
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {balance} ${symbol.toUpperCase()}
            </div>
            <div className="text-sm text-[#adadad]">
              Current reward pool balance
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-white">
              Reward Pool Address:
            </div>
            <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#30363d]">
              <code className="text-sm text-[#adadad] flex-1 font-mono">
                {formatAddress(walletAddress)}
              </code>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-[#30363d]"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-[#adadad]" />
                )}
              </Button>
            </div>
            <div className="text-xs text-[#adadad]">
              {`This is your game's reward pool address where players can receive
              tokens.`}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
