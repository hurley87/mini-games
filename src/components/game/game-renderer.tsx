'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

interface GameRendererProps {
  id: string;
  refreshKey?: number;
}

export function GameRenderer({ id, refreshKey }: GameRendererProps) {
  const [loading, setLoading] = useState(true);
  const { user } = usePrivy();
  const address = user?.farcaster?.fid;

  // Debug logs
  console.log('Game ID:', id);
  console.log('Wallet Address:', address);

  const iframeUrl = `/api/embed/${id}?userId=${address}&gameId=${id}&refresh=${refreshKey}`;
  console.log('Iframe URL:', iframeUrl);

  useEffect(() => {
    setLoading(true);
  }, [iframeUrl]);

  if (!address) {
    return <div>Please connect your wallet to play the game</div>;
  }

  return (
    <div
      style={{
        width: '400px',
        height: '750px',
        position: 'relative',
        margin: '0 auto',
        borderRadius: '30px',
        overflow: 'hidden',
      }}
    >
      {loading && <p>Loading game...</p>}
      <iframe
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
