'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Share2, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface PublishButtonProps {
  buildId: string;
}

export default function PublishButton({ buildId }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedCoin, setPublishedCoin] = useState<{
    address: string;
    name: string;
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

  const handleShare = async () => {
    if (!publishedCoin) return;

    const shareUrl = `${window.location.origin}/coin/${publishedCoin.address}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: publishedCoin.name,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share');
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
        <Button
          className="bg-white cursor-pointer"
          variant="secondary"
          size="lg"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      )}
    </div>
  );
}
