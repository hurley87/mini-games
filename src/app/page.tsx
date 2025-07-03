import Link from 'next/link';
import { getCoins } from '@/lib/supabase';

export default async function Home() {
  const coins = await getCoins();

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white p-4">
      <h1 className="text-3xl font-semibold text-center mb-8">Coins</h1>
      <div className="grid gap-6 max-w-5xl mx-auto">
        {coins.map((coin) => (
          <Link
            key={coin.id}
            href={`/coins/${coin.id}`}
            className="flex flex-col md:flex-row bg-[#2a2a2a] hover:bg-[#333] rounded-lg overflow-hidden"
          >
            {coin.image && (
              <img
                src={coin.image}
                alt={coin.name}
                className="w-full md:w-48 h-48 object-cover"
              />
            )}
            <div className="p-4 flex-1">
              <h2 className="text-xl font-bold">{coin.name}</h2>
              <p className="text-sm text-gray-400 mb-2">{coin.symbol}</p>
              {coin.builds?.description && (
                <p className="text-gray-300">{coin.builds.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
