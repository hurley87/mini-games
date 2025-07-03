import { GameWithTimer } from '@/components/game/game-with-timer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBuild, getCoin } from '@/lib/supabase';
import { ChevronLeft, Share2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

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
          <h1 className="ml-2 text-sm font-medium">Mini Games Studio</h1>
        </div>

        <Link
          href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(
            `Check out ${coin.name}, it's pretty cool`
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
            Share
          </Button>
        </Link>
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
                  max_points: coin.max_points,
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
                    Token Symbol:{' '}
                    <span className="text-white font-medium">
                      {coin.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {coin.coin_address && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-white">
                    Contract Address
                  </h2>
                  <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                    <code className="text-sm text-[#c9d1d9] font-mono break-all select-all">
                      {coin.coin_address}
                    </code>
                  </div>
                </div>
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

              <div className="pt-0">
                {/* Trading Interface */}
                <Tabs defaultValue="buy" className="space-y-4">
                  {/* Buy/Sell Tabs */}
                  <TabsList className="grid w-full grid-cols-2 bg-[#21262d] h-auto p-1">
                    <TabsTrigger
                      value="buy"
                      className="data-[state=active]:bg-white data-[state=active]:text-black text-[#c9d1d9] py-2"
                    >
                      Buy
                    </TabsTrigger>
                    <TabsTrigger
                      value="sell"
                      className="data-[state=active]:bg-white data-[state=active]:text-black text-[#c9d1d9] py-2"
                    >
                      Sell
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="space-y-4 mt-4">
                    {/* Balance */}
                    <div className="text-right">
                      <span className="text-sm text-[#adadad]">Balance </span>
                      <span className="text-sm text-white font-medium">
                        0 ETH
                      </span>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-4">
                        <input
                          type="text"
                          placeholder="0.000111"
                          className="bg-transparent text-2xl text-white font-medium outline-none flex-1"
                          defaultValue="0.000111"
                        />
                        <div className="flex items-center gap-2 text-[#c9d1d9]">
                          <span className="font-medium">ETH</span>
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          0.001 ETH
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          0.01 ETH
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          0.1 ETH
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          Max
                        </button>
                      </div>

                      {/* Buy Button */}
                      <button className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors mt-6">
                        Buy
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-4 mt-4">
                    {/* Balance */}
                    <div className="text-right">
                      <span className="text-sm text-[#adadad]">Balance </span>
                      <span className="text-sm text-white font-medium">
                        0 {coin.symbol}
                      </span>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-4">
                        <input
                          type="text"
                          placeholder="0.000111"
                          className="bg-transparent text-2xl text-white font-medium outline-none flex-1"
                          defaultValue="0.000111"
                        />
                        <div className="flex items-center gap-2 text-[#c9d1d9]">
                          {coin.image && (
                            <img
                              src={coin.image}
                              alt={coin.symbol}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="font-medium">{coin.symbol}</span>
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          25%
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          50%
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          75%
                        </button>
                        <button className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors">
                          Max
                        </button>
                      </div>

                      {/* Sell Button */}
                      <button className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors mt-6">
                        Sell
                      </button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
