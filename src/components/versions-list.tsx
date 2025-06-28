'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  Trash2,
  RotateCcw,
  Eye,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVersions } from '@/hooks/use-versions';

interface VersionsListProps {
  buildId: string;
  onVersionRestored?: () => void;
}

export interface VersionsListRef {
  refreshVersions: () => void;
}

const VersionsList = forwardRef<VersionsListRef, VersionsListProps>(
  ({ buildId, onVersionRestored }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [processingVersionId, setProcessingVersionId] = useState<
      string | null
    >(null);

    const {
      versions,
      isLoading,
      error,
      fetchVersions,
      deleteVersion,
      restoreVersion,
    } = useVersions(buildId);

    useImperativeHandle(ref, () => ({
      refreshVersions: fetchVersions,
    }));

    const handleDeleteVersion = async (versionId: string) => {
      if (
        !confirm(
          'Are you sure you want to delete this version? This action cannot be undone.'
        )
      ) {
        return;
      }

      try {
        setProcessingVersionId(versionId);
        const result = await deleteVersion(versionId);

        if (result.success) {
          toast.success('Version deleted successfully');
        } else {
          toast.error(result.error || 'Failed to delete version');
        }
      } finally {
        setProcessingVersionId(null);
      }
    };

    const handleRestoreVersion = async (
      versionId: string,
      versionNumber: number
    ) => {
      if (
        !confirm(
          `Are you sure you want to restore to version ${versionNumber}? This will create a new version of the current build.`
        )
      ) {
        return;
      }

      try {
        setProcessingVersionId(versionId);
        const result = await restoreVersion(versionId);

        if (result.success) {
          toast.success(result.message || 'Version restored successfully');
          if (onVersionRestored) {
            onVersionRestored();
          }
        } else {
          toast.error(result.error || 'Failed to restore version');
        }
      } finally {
        setProcessingVersionId(null);
      }
    };

    const handleToggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
    };

    const handleRefresh = () => {
      fetchVersions();
    };

    if (isLoading && versions.length === 0) {
      return (
        <div className="w-64 bg-[#1a1a1a] border-r border-[#30363d] p-4">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${
          isCollapsed ? 'w-12' : 'w-64'
        } bg-[#1a1a1a] border-r border-[#30363d] transition-all duration-200 flex flex-col h-full`}
      >
        {/* Header */}
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Versions</span>
              <Badge variant="secondary" className="text-xs">
                {versions.length}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-6 w-6 text-gray-400 hover:text-white"
                title="Refresh versions"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapse}
              className="h-6 w-6 text-gray-400 hover:text-white"
            >
              {isCollapsed ? (
                <Eye className="h-3 w-3" />
              ) : (
                <History className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-2">
            {error && (
              <div className="text-red-400 text-xs p-2 mb-2 bg-red-900/20 rounded border border-red-800">
                {error}
              </div>
            )}

            {versions.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No versions yet
                <p className="text-xs mt-1">
                  Versions will appear when you update your build
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="bg-[#2a2a2a] rounded-md p-3 hover:bg-[#333333] transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0.5 text-white"
                          >
                            v{version.version_number}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-white truncate">
                          {version.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleRestoreVersion(
                            version.id,
                            version.version_number
                          )
                        }
                        disabled={processingVersionId === version.id}
                        className="h-6 w-6 text-gray-400 hover:text-green-400 cursor-pointer hover:bg-transparent"
                        title="Restore this version"
                      >
                        {processingVersionId === version.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVersion(version.id)}
                        disabled={processingVersionId === version.id}
                        className="h-6 w-6 text-gray-400 hover:text-red-400 cursor-pointer hover:bg-transparent"
                        title="Delete this version"
                      >
                        {processingVersionId === version.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

VersionsList.displayName = 'VersionsList';

export default VersionsList;
