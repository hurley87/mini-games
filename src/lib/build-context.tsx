import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const addBuild = useCallback((build: Build) => {
    setBuilds((prev) => [build, ...prev]);
  }, []);

  return (
    <BuildContext.Provider value={{ builds, isLoading, error, addBuild, refreshBuilds: fetchBuilds }}>
      {children}
    </BuildContext.Provider>
  );
}

export function useBuilds() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error('useBuilds must be used within a BuildProvider');
  return ctx;
}
