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
      className="border-4 border-white rounded-lg shadow-sm shadow-amber-100 p-1 bg-[#30363d]"
      style={{
        width: '400px',
        height: '750px',
        position: 'relative',
        margin: '0 auto',
        borderRadius: '30px',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#30363d]/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      <iframe
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          border: '4px solid #30363d',
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
