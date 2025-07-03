'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { usePrivy } from '@privy-io/react-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function Header() {
  const { authenticated, user, login, logout } = usePrivy();
  const username = user?.farcaster?.username;
  const pfp = user?.farcaster?.pfp;

  return (
    <header className="border-b border-gray-800 p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <div className="text-white font-medium flex items-center gap-2 px-2 cursor-pointer">
            <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center">
              <span className="text-xs">M</span>
            </div>
            Mini Games
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/create" className="text-gray-300 hover:text-gray-200">
          Create
        </Link>
        <Link href="/docs" className="text-gray-300 hover:text-gray-200">
          Docs
        </Link>
        {authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto hover:bg-transparent"
              >
                <img
                  src={pfp || ''}
                  alt={username || ''}
                  className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-gray-600 transition-all"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#1a1a1a] border-gray-800"
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <img
                  src={pfp || ''}
                  alt={username || ''}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-200">
                  {username}
                </span>
              </div>
              <DropdownMenuItem
                onClick={logout}
                className="text-red-400 hover:text-red-300 hover:bg-[#2a2a2a] cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={login}>Login</Button>
        )}
      </div>
    </header>
  );
}
