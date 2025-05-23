'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareBuildButtonProps {
  id: string;
  title: string;
}

export default function ShareBuildButton({ id, title }: ShareBuildButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/game/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user might cancel share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-400 hover:text-gray-200 cursor-pointer"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
