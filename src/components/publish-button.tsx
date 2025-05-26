'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Share2, Loader2, Rocket, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface PublishButtonProps {
  buildId: string;
}

export default function PublishButton({ buildId }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedCoin, setPublishedCoin] = useState<{
    address: string;
    name: string;
    symbol: string;
  } | null>(null);

  useEffect(() => {
    const fetchPublishedCoin = async () => {
      try {
        const response = await fetch(`/api/coins/${buildId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch coin data');
        }
        const data = await response.json();

        console.log('data', data);

        if (data.coin) {
          setPublishedCoin({
            address: data.coin.address,
            name: data.coin.name,
            symbol: data.coin.symbol,
          });
        }
      } catch (error) {
        console.error('Error fetching published coin:', error);
      }
    };

    fetchPublishedCoin();
  }, [buildId]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buildId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      setPublishedCoin(data.coin);
      toast.success('Game published successfully!');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish game');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!publishedCoin ? (
        <Button
          className="bg-white cursor-pointer relative"
          variant="secondary"
          size="lg"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Publish</span>
            </div>
          )}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href={`https://zora.co/coin/base:${publishedCoin.address}`}
            target="_blank"
          >
            <Button
              className="h-10 bg-transparent cursor-pointer"
              variant="outline"
              size="lg"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Trade
            </Button>
          </Link>
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
