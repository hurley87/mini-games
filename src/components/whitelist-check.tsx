'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { isUserWhitelisted } from '@/lib/whitelist';

interface WhitelistCheckProps {
  children: ReactNode;
}

/**
 * Gate component that only renders its children for whitelisted Farcaster users.
 * Non-whitelisted users are asked to DM @hurls to request access.
 */
export default function WhitelistCheck({ children }: WhitelistCheckProps) {
  const { authenticated, ready, user } = usePrivy();

  if (!ready) {
    return null;
  }

  if (authenticated && !isUserWhitelisted(user?.farcaster?.username)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white">
        <p className="text-center">
          You are not whitelisted. DM <span className="font-semibold">@hurls</span>{' '}
          on Farcaster to be added.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
