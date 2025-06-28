'use client';

import { useState, useRef } from 'react';
import Chat from '@/components/chat';
import { GameRenderer } from '@/components/game/game-renderer';
import VersionsList, { VersionsListRef } from '@/components/versions-list';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageCircle, MonitorPlay, Maximize2, Minimize2 } from 'lucide-react';

interface BuildClientProps {
  buildId: string;
  threadId: string;
}

export default function BuildClient({ buildId, threadId }: BuildClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const versionsListRef = useRef<VersionsListRef>(null);

  const handleBuildUpdated = () => {
    setRefreshKey((prev) => prev + 1);
    // Refresh versions list when build is updated
    versionsListRef.current?.refreshVersions();
  };

  const handleVersionRestored = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div
      className={`flex h-screen overflow-hidden w-full max-w-screen-xl mx-auto border-l border-[#30363d] flex-col md:flex-row`}
    >
      {/* Versions sidebar */}
      <VersionsList
        ref={versionsListRef}
        buildId={buildId}
        onVersionRestored={handleVersionRestored}
      />

      {/* Chat sidebar */}
      <div
        className={`flex-1 min-w-0 border-r border-[#30363d] flex flex-col h-full ${isPreviewExpanded ? 'hidden' : ''}`}
      >
        <div className="border-b border-[#30363d] p-2">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Build Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Chat
            buildId={buildId}
            threadId={threadId}
            onBuildUpdated={handleBuildUpdated}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        className={`${isPreviewExpanded ? 'w-full' : 'w-2/5'} flex-shrink-0 h-full flex flex-col`}
      >
        <div className="border-b border-[#30363d] p-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <MonitorPlay className="h-4 w-4" /> Game Preview
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="h-6 w-6 text-gray-400 hover:text-white"
              title="Refresh preview"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPreviewExpanded((prev) => !prev)}
              className="h-6 w-6 text-gray-400 hover:text-white"
              title={isPreviewExpanded ? 'Collapse preview' : 'Expand preview'}
            >
              {isPreviewExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <GameRenderer id={buildId} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
