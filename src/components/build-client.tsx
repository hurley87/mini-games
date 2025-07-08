'use client';

import { useState, useRef, useEffect } from 'react';
import Chat from '@/components/chat';
import { GameRenderer } from '@/components/game/game-renderer';
import VersionsList, { VersionsListRef } from '@/components/versions-list';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  MessageCircle,
  MonitorPlay,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface BuildClientProps {
  buildId: string;
  threadId: string;
}

interface Build {
  id: string;
  title: string;
  description: string;
  html: string;
  created_at: string;
  fid: number;
  thread_id: string;
  model: string;
  image?: string;
  tutorial?: string;
  status?: string;
  error_message?: string;
  isPublished?: boolean;
  coin?: {
    address: string;
    name: string;
    symbol: string;
  } | null;
}

export default function BuildClient({ buildId, threadId }: BuildClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [build, setBuild] = useState<Build | null>(null);
  const [isLoadingBuild, setIsLoadingBuild] = useState(true);
  const versionsListRef = useRef<VersionsListRef>(null);

  const handleBuildUpdated = () => {
    setRefreshKey((prev) => prev + 1);
    // Refresh versions list when build is updated
    versionsListRef.current?.refreshVersions();
  };

  const handleVersionRestored = () => {
    setRefreshKey((prev) => prev + 1);
    // Refresh build data when version is restored
    fetchBuild();
  };

  const fetchBuild = async () => {
    try {
      setIsLoadingBuild(true);
      const response = await fetch(`/api/builds/${buildId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch build');
      }

      const result = await response.json();

      if (result.success) {
        setBuild(result.data);
      } else {
        console.error('Error fetching build:', result.message);
      }
    } catch (error) {
      console.error('Error fetching build:', error);
    } finally {
      setIsLoadingBuild(false);
    }
  };

  useEffect(() => {
    fetchBuild();
  }, [buildId]);

  return (
    <div
      className={`flex h-screen overflow-hidden w-full border-l border-[#30363d] flex-col md:flex-row`}
    >
      {/* Versions sidebar */}
      <div
        className={`${
          isPreviewExpanded ? 'hidden' : 'flex-1'
        } min-w-0 border-r border-[#30363d] flex flex-col h-full`}
      >
        <VersionsList
          ref={versionsListRef}
          buildId={buildId}
          onVersionRestored={handleVersionRestored}
        />
      </div>

      {/* Chat sidebar */}
      <div
        className={`${
          isPreviewExpanded ? 'hidden' : 'flex-1'
        } min-w-0 border-r border-[#30363d] flex flex-col h-full`}
      >
        <div className="border-b border-[#30363d] p-3 flex items-center justify-between min-h-[48px]">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Build Chat
          </h2>
          <div className="h-6 w-6"></div>
        </div>

        {/* Build Description - Fixed at top */}
        {build && !isLoadingBuild && (
          <div className="border-b border-[#30363d] p-3 bg-[#1a1a1a]">
            <div className="mb-2">
              <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                Original Prompt
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {build.description}
            </p>
          </div>
        )}

        {/* Chat - Scrollable underneath description */}
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
        className={`${
          isPreviewExpanded ? 'w-full' : 'flex-1'
        } min-w-0 h-full flex flex-col border-r border-[#30363d]`}
      >
        <div className="border-b border-[#30363d] p-3 flex items-center justify-between">
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
