import Header from '@/components/header';

export const metadata = {
  title: 'Creator Docs - Mini Games Studio',
  description: 'Learn how to create and publish mini games with optional tokens.'
};

/**
 * Detailed documentation for creators building mini games.
 * Covers the workflow, game models, scoring and token mechanics.
 */
export default function CreatorDocs() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto p-6 space-y-8">
        <section>
          <h1 className="text-3xl font-semibold mb-4">Getting Started</h1>
          <p className="text-zinc-300">
            Mini Games Studio lets you craft bite-sized games that run inside
            Farcaster mini apps. Sign in with your Farcaster account and create
            a new build to begin.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Building and Testing</h2>
          <p className="text-zinc-300">
            Use the chat on the left side of the build page to describe changes
            or new ideas. The assistant updates your game in real-time.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Open a build from your dashboard.</li>
            <li>Describe features, rules or artwork in the chat window.</li>
            <li>Test the game in the preview on the right and iterate until it feels just right.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Game Models</h2>
          <p className="text-zinc-300">
            Choose from several starter models when beginning a build:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-300">
            <li>
              <strong>Arcade</strong> – fast-paced action with built-in movement and score tracking.
            </li>
            <li>
              <strong>Puzzle</strong> – grid based challenges ideal for matching or logic games.
            </li>
            <li>
              <strong>Trivia</strong> – multiple choice questions and timers for quick quizzes.
            </li>
          </ul>
          <p className="text-zinc-300">
            Each model provides a foundation so you can focus on rules and visuals instead of boilerplate code.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Example Games</h2>
          <p className="text-zinc-300">
            Create endless variations: a side-scrolling runner where users collect tokens, a word scramble puzzle, or a head-to-head trivia battle. The templates are flexible, so experiment with mechanics that fit your community.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">How Scoring Works</h2>
          <p className="text-zinc-300">
            Players earn points during gameplay. Call <code>window.awardPoints(score)</code> to record points on the server. You decide when to award points—after levels, for speed bonuses or any rule you invent.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Tokens and Rewards</h2>
          <p className="text-zinc-300">
            When publishing a game you can mint a token that represents it. Set the name and symbol in the publish dialog. Tokens are distributed based on final scores, so top players collect the most.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Playing on Farcaster</h2>
          <p className="text-zinc-300">
            Games are played directly in the Farcaster feed. Share your game link and anyone can jump in, play and start earning points immediately. You can also share a /coin link so players can collect your token.
          </p>
        </section>
      </main>
    </div>
  );
}
