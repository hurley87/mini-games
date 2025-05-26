'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BuildOwnerCheckProps {
  buildId: string;
  buildFid: number;
  children: React.ReactNode;
}

export default function BuildOwnerCheck({
  buildFid,
  children,
}: BuildOwnerCheckProps) {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!ready) return;

      // If not authenticated, redirect to home
      if (!authenticated || !user) {
        router.push('/');
        return;
      }

      // Check if the current user's FID matches the build's FID
      const userFid = user.farcaster?.fid;

      if (!userFid || userFid !== buildFid) {
        // Not the owner, redirect to home
        router.push('/');
        return;
      }

      // User is the owner
      setIsOwner(true);
      setIsChecking(false);
    };

    checkOwnership();
  }, [authenticated, ready, user, buildFid, router]);

  if (!ready || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c9d1d9]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return <>{children}</>;
}
