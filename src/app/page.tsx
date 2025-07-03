import Link from 'next/link';
import { getCoins } from '@/lib/supabase';
import Header from '@/components/header';

export default async function Home() {
  const coins = await getCoins();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <main className="p-4">
        <div className="max-w-md mx-auto space-y-6">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#3a3a3a]"
            >
              {/* Creator Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex items-center gap-2">
                  {coin.creators?.pfp && (
                    <img
                      src={coin.creators.pfp}
                      alt={coin.creators.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="text-white font-medium text-sm">
                    {coin.creators?.username || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Game Image */}
              <div className="relative aspect-square">
                {coin.image ? (
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl font-bold">{coin.symbol}</span>
                  </div>
                )}
              </div>

              {/* Stats and Actions */}
              <div className="p-4">
                {/* Token name and description */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {coin.name}
                  </h2>
                  {coin.builds?.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {coin.builds.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stats and Play Button */}
                <div className="flex items-center justify-end">
                  {/* Left side stats */}

                  {/* Play Button */}
                  <Link
                    href={`/coins/${coin.id}`}
                    className="bg-white text-black w-full px-6 py-2 rounded-lg font-semibold transition-colors text-center"
                  >
                    Play
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
