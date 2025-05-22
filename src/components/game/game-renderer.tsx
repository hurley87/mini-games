'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface GameRendererProps {
  id: string;
  refreshKey?: number;
}

export function GameRenderer({ id, refreshKey }: GameRendererProps) {
  const [loading, setLoading] = useState(true);
  const { address, isConnecting } = useAccount();

  // Debug logs
  console.log('Game ID:', id);
  console.log('Wallet Address:', address);
  console.log('Is Connecting:', isConnecting);

  const iframeUrl = `/api/embed/${id}?userId=${address}&gameId=${id}&refresh=${refreshKey}`;
  console.log('Iframe URL:', iframeUrl);

  useEffect(() => {
    setLoading(true);
  }, [iframeUrl]);

  if (isConnecting) {
    return <div>Connecting wallet...</div>;
  }

  if (!address) {
    return <div>Please connect your wallet to play the game</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
