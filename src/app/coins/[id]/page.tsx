import { GameWithTimer } from '@/components/game/game-with-timer';
import { Button } from '@/components/ui/button';
import { getBuild, getCoin } from '@/lib/supabase';
import { ChevronLeft, ExternalLink, Share2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ContractAddressDisplay from '@/components/contract-address-display';

interface CoinPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CoinPageProps): Promise<Metadata> {
  const { id } = await params;
  const coin = await getCoin(id);
  return {
    title: coin ? `${coin.name} - Mini Game` : 'Game Not Found',
    description: coin ? `Play ${coin.name} on Mini Games Studio` : undefined,
  };
}

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;

  // Validate that the ID is provided and not "undefined"
  if (!id || id === 'undefined') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Game ID</h1>
          <p className="text-gray-400">The game ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Game ID Format</h1>
          <p className="text-gray-400">The game ID format is not valid.</p>
        </div>
      </div>
    );
  }

  const coin = await getCoin(id);

  if (!coin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <p className="text-gray-400">
            {`The game you're looking for doesn't exist.`}
          </p>
        </div>
      </div>
    );
  }

  const build = await getBuild(coin.build_id);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] text-[#c9d1d9] font-sans">
      <header className="flex items-center justify-between p-3 border-b border-[#30363d]">
        <div className="flex items-center">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#c9d1d9] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-2 text-sm font-medium">Mini Games</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`https://zora.co/coin/base:${coin.coin_address}`}
            target="_blank"
          >
            <Button
              variant="outline"
              size="lg"
              className="text-white bg-transparent border-white cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Trade ${coin.symbol}
            </Button>
          </Link>
          <Link
            href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(
              `Play ${coin.name}, earn $${coin.symbol}`
            )}&embeds[]=${encodeURIComponent(
              `https://app.minigames.studio/coins/${coin.id}`
            )}`}
            target="_blank"
          >
            <Button
              variant="outline"
              size="lg"
              className="text-black bg-white cursor-pointer"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Play to Earn ${coin.symbol}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Game */}
            <div className="flex justify-center">
              <GameWithTimer
                id={coin.build_id}
                coin={{
                  name: coin.name,
                  symbol: coin.symbol,
                  image: coin.image,
                  duration: coin.duration,
                }}
              />
            </div>

            {/* Right Column - Coin Information */}
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-center gap-3">
                {coin.image && (
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{coin.name}</h1>
                  <div className="text-sm text-[#adadad] mt-1">
                    ${coin.symbol}
                  </div>
                </div>
              </div>

              {coin.coin_address && (
                <ContractAddressDisplay contractAddress={coin.coin_address} />
              )}

              {build?.tutorial && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-white">
                    How to Play
                  </h2>
                  <p className="text-[#adadad] leading-relaxed">
                    {build.tutorial}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
