'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePrivy } from '@privy-io/react-auth';

export type Build = {
  id: string;
  title: string;
  html: string;
  created_at: string;
  model?: string;
  image?: string;
  isPublished: boolean;
  status?: string;
  error_message?: string;
  coin?: {
    address: string;
    name: string;
    symbol: string;
  } | null;
};

type BuildContextValue = {
  builds: Build[];
  isLoading: boolean;
  error: string | null;
  addBuild: (build: Build) => void;
  refreshBuilds: () => Promise<void>;
  updateProcessingBuilds: (processingBuildIds: string[]) => Promise<void>;
};

const BuildContext = createContext<BuildContextValue | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const { user } = usePrivy();
  const fid = user?.farcaster?.fid;

  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuilds = useCallback(async () => {
    if (fid === undefined) return;
    if (fid === null || !Number.isInteger(fid) || fid <= 0) {
      setBuilds([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/builds?fid=${fid}`);
      if (!response.ok) throw new Error('Failed to fetch builds');
      const data = await response.json();
      setBuilds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  const updateProcessingBuilds = useCallback(
    async (processingBuildIds: string[]) => {
      if (processingBuildIds.length === 0) return;

      try {
        // Fetch individual build status for each processing build
        const buildUpdates = await Promise.all(
          processingBuildIds.map(async (buildId) => {
            try {
              const response = await fetch(
                `/api/build-status?buildId=${buildId}`
              );
              if (!response.ok)
                throw new Error(`Failed to fetch build ${buildId}`);
              const result = await response.json();
              if (result.success) {
                return result.data;
              }
              return null;
            } catch (err) {
              console.error(`Error fetching build ${buildId}:`, err);
              return null;
            }
          })
        );

        // Filter out failed requests and update builds state
        const validUpdates = buildUpdates.filter((update) => update !== null);

        if (validUpdates.length > 0) {
          setBuilds((prevBuilds) =>
            prevBuilds.map((build) => {
              const update = validUpdates.find((u) => u.id === build.id);
              return update ? { ...build, ...update } : build;
            })
          );
        }
      } catch (err) {
        console.error('Error updating processing builds:', err);
        // Don't set error state for polling failures to avoid disrupting UX
      }
    },
    []
  );

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const addBuild = useCallback((build: Build) => {
    setBuilds((prev) => [build, ...prev]);
  }, []);

  return (
    <BuildContext.Provider
      value={{
        builds,
        isLoading,
        error,
        addBuild,
        refreshBuilds: fetchBuilds,
        updateProcessingBuilds,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}

export function useBuilds() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error('useBuilds must be used within a BuildProvider');
  return ctx;
}
