import { GameRenderer } from '@/components/game/game-renderer';
import { getBuild } from '@/lib/supabase';
import { Metadata } from 'next';

interface BuildPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BuildPageProps): Promise<Metadata> {
  const { id } = await params;
  const build = await getBuild(id);
  return {
    title: `Build Game - ${build.title}`,
    description: 'Build and test your game in real-time',
  };
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { id } = await params;
  console.log('id', id);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-7xl h-[calc(100vh-4rem)]">
        <div className="w-full h-[calc(100%-5rem)] bg-gray-100 rounded-lg overflow-hidden">
          <GameRenderer id={id} />
        </div>
      </div>
    </main>
  );
}
