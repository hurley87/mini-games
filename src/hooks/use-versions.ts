import { useState, useEffect, useCallback } from 'react';

export type BuildVersion = {
  id: string;
  build_id: string;
  version_number: number;
  title: string;
  html: string;
  created_at: string;
  created_by_fid: number;
  description: string;
};

export function useVersions(buildId: string) {
  const [versions, setVersions] = useState<BuildVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/builds/${buildId}/versions`);
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.data);
      } else {
        setError(data.message || 'Failed to fetch versions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
    } finally {
      setIsLoading(false);
    }
  }, [buildId]);

  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      const response = await fetch(`/api/builds/${buildId}/versions/${versionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVersions(prev => prev.filter(v => v.id !== versionId));
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to delete version' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete version' };
    }
  }, [buildId]);

  const restoreVersion = useCallback(async (versionId: string) => {
    try {
      const response = await fetch(`/api/builds/${buildId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh versions list to show the new version created during restore
        await fetchVersions();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || 'Failed to restore version' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to restore version' };
    }
  }, [buildId, fetchVersions]);

  useEffect(() => {
    if (buildId) {
      fetchVersions();
    }
  }, [buildId, fetchVersions]);

  return {
    versions,
    isLoading,
    error,
    fetchVersions,
    deleteVersion,
    restoreVersion,
  };
}