import { notFound } from 'next/navigation';
import { GameRenderer } from '@/components/game/game-renderer';

export const dynamic = 'force-dynamic';

async function getGame(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/games/${id}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
        <p className="text-gray-600">Category: {game.category}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="prose max-w-none">
          <GameRenderer reactCode={game.react_code} />
        </div>
      </div>
    </div>
  );
}