'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { WalletConnect } from './wallet-connect';

export default function Header() {
  return (
    <header className="border-b border-gray-800 p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <Button
            variant="ghost"
            className="text-white font-medium flex items-center gap-2 px-2 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center">
              <span className="text-xs">M</span>
            </div>
            Mini Games
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="#" className="text-gray-300 hover:text-gray-200">
          Docs
        </Link>
        <WalletConnect />
      </div>
    </header>
  );
}
