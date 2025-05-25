import Header from '@/components/header';

export const metadata = {
  title: 'Creator Docs - Mini Games Studio',
  description: 'Learn how to create and publish mini games with optional tokens.'
};

export default function CreatorDocs() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto p-6 space-y-8">
        <section>
          <h1 className="text-3xl font-semibold mb-4">Getting Started</h1>
          <p className="text-zinc-300">
            Mini Games Studio lets you craft bite-sized games that run inside
            Farcaster mini apps. Start by describing your idea and the studio
            will build a playable prototype.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Tokens and Rewards</h2>
          <p className="text-zinc-300">
            When your game is ready, you can choose to publish a token for your
            community. Players earn these tokens by racking up points while they
            play. The more points they collect, the more tokens they receive.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Playing on Farcaster</h2>
          <p className="text-zinc-300">
            All games built with the studio are played directly in the
            Farcaster feed. Share your link and anyone can jump in, play, and
            start earning points immediately.
          </p>
        </section>
      </main>
    </div>
  );
}
