'use client';

import { useState } from 'react';
import Chat from '@/components/chat';
import { GameRenderer } from '@/components/game/game-renderer';

interface BuildClientProps {
  buildId: string;
  threadId: string;
}

export default function BuildClient({ buildId, threadId }: BuildClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBuildUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar */}
      <div className="w-96 border-r border-[#30363d] flex flex-col">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Chat threadId={threadId} onBuildUpdated={handleBuildUpdated} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 h-full">
        <div className="w-full h-full">
          <GameRenderer id={buildId} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
