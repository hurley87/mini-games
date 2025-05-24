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
    <div className="flex gap-8 h-screen overflow-hidden w-full max-w-screen-lg mx-auto border-l border-[#30363d]">
      {/* Left sidebar */}
      <div className="flex-1 min-w-0 border-r border-[#30363d] flex flex-col h-full">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Chat
            buildId={buildId}
            threadId={threadId}
            onBuildUpdated={handleBuildUpdated}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="w-2/5 flex-shrink-0 h-full flex flex-col justify-center">
        <GameRenderer id={buildId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
