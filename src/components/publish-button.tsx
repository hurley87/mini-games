'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import TokenDialog from './token-dialog';
import CoinRewards from './coin-rewards';

interface PublishButtonProps {
  buildId: string;
}

export default function PublishButton({ buildId }: PublishButtonProps) {
  const { user, linkWallet } = usePrivy();
  const [publishedCoin, setPublishedCoin] = useState<{
    address: string;
    name: string;
    symbol: string;
    walletAddress: string;
  } | null>(null);

  const hasWallet = user?.wallet;

  const fetchPublishedCoin = useCallback(async () => {
    try {
      const response = await fetch(`/api/coins/${buildId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coin data');
      }
      const data = await response.json();

      if (data.coin) {
        setPublishedCoin({
          address: data.coin.coin_address,
          name: data.coin.name,
          symbol: data.coin.symbol,
          walletAddress: data.coin.wallet_address,
        });
      }
    } catch (error) {
      console.error('Error fetching published coin:', error);
    }
  }, [buildId]);

  useEffect(() => {
    fetchPublishedCoin();
  }, [fetchPublishedCoin]);

  // Callback to handle successful pool funding
  const handlePoolFunded = useCallback(() => {
    // Refetch the coin data to update the UI
    fetchPublishedCoin();
  }, [fetchPublishedCoin]);

  if (!hasWallet) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={linkWallet} variant="secondary" size="lg">
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!publishedCoin ? (
        <TokenDialog buildId={buildId} onPoolFunded={handlePoolFunded} />
      ) : (
        <div className="flex items-center gap-2">
          <CoinRewards
            coinAddress={publishedCoin.address}
            walletAddress={publishedCoin.walletAddress}
            symbol={publishedCoin.symbol}
          />
          <Link
            href={`https://farcaster.xyz/~/compose?text=Check out my new game called ${publishedCoin.name} build with @minigames`}
            target="_blank"
          >
            <Button
              className="bg-white cursor-pointer"
              variant="secondary"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
