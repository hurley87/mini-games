'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface GameRendererProps {
  id: string;
}

export function GameRenderer({ id }: GameRendererProps) {
  const [loading, setLoading] = useState(true);
  const { address, isConnecting } = useAccount();

  // Debug logs
  console.log('Game ID:', id);
  console.log('Wallet Address:', address);
  console.log('Is Connecting:', isConnecting);

  const iframeUrl = `/api/embed/${id}?userId=${address}&gameId=${id}`;
  console.log('Iframe URL:', iframeUrl);

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
        sandbox="allow-scripts"
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