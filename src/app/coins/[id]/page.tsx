import { GameRenderer } from '@/components/game/game-renderer';
import { Button } from '@/components/ui/button';
import { getBuild, getCoin } from '@/lib/supabase';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

interface CoinPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CoinPageProps): Promise<Metadata> {
  const { id } = await params;
  const coin = await getCoin(id);
  return {
    title: coin ? `${coin.name} - Mini Game` : 'Game Not Found',
    description: coin ? `Play ${coin.name} on Mini Games Studio` : undefined,
  };
}

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;
  const coin = await getCoin(id);

  if (!coin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">
        Game not found
      </div>
    );
  }

  const build = await getBuild(coin.build_id);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] text-[#c9d1d9] font-sans">
      <header className="flex items-center p-3 border-b border-[#30363d]">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-[#c9d1d9] cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        {coin.image && (
          <img src={coin.image} alt={coin.name} className="w-8 h-8 object-cover rounded-md ml-2" />
        )}
        <h1 className="ml-2 text-sm font-medium">{coin.name}</h1>
      </header>
      <main className="flex-1 flex flex-col items-center gap-6 p-4 overflow-y-auto">
        <GameRenderer id={coin.build_id} />
        {build?.tutorial && (
          <p className="max-w-md text-center text-[#adadad] text-sm">{build.tutorial}</p>
        )}
        <div className="text-xs text-[#adadad]">
          Token Symbol: <span className="text-white font-medium">{coin.symbol}</span>
        </div>
      </main>
    </div>
  );
}
