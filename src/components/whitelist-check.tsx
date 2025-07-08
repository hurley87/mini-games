'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { isUserWhitelisted } from '@/lib/whitelist';
import Link from 'next/link';
import Header from './header';

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
      <div className="min-h-screen flex flex-col bg-[#1a1a1a] text-white">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <p className="text-center">
            You are not whitelisted.{' '}
            <Link
              href="https://farcaster.xyz/hurls"
              target="_blank"
              className="text-purple-500 hover:text-purple-400"
            >
              DM <span className="font-semibold">@hurls</span> on Farcaster
            </Link>{' '}
            to be added.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
