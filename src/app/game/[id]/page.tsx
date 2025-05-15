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

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  return (
    <div className="w-screen h-screen">
      <GameRenderer id={id} />
    </div>
  );
}