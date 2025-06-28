import Header from '@/components/header';

export const metadata = {
  title: 'Creator Docs - Mini Games Studio',
  description:
    'Learn how to create and publish mini games with optional tokens.',
};

/**
 * Detailed documentation for creators building mini games.
 * Covers the workflow, AI models, prompting strategies, scoring and token mechanics.
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
          <h2 className="text-2xl font-semibold mb-2">AI Models</h2>
          <p className="text-zinc-300 mb-4">
            Choose from three AI models when creating your game. Each model has
            different strengths:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>GPT-4.1</strong> – Most capable model, best for complex
              game mechanics and sophisticated logic. Great for puzzle games and
              strategic gameplay.
            </li>
            <li>
              <strong>GPT-4o</strong> – Fast and capable, balanced performance.
              Good for action games and real-time interactions.
            </li>
            <li>
              <strong>GPT-4o-mini</strong> – Quickest model, ideal for simple
              arcade-style games and rapid prototyping.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">
            How to Write Effective Prompts
          </h2>
          <p className="text-zinc-300 mb-4">
            The AI generates complete HTML5 games based on your description.
            Follow these guidelines for best results:
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">
            Key Constraints to Remember
          </h3>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              Games must be <strong>30 seconds long</strong> before they reset
            </li>
            <li>
              Use <strong>mouse/tap input only</strong> (no keyboard, no swipes)
            </li>
            <li>
              Games run in a <strong>sandboxed iframe</strong> (no external
              packages)
            </li>
            <li>
              Canvas must <strong>fill the entire screen</strong>
            </li>
            <li>
              Score increases <strong>1 point at a time</strong> only
            </li>
            <li>
              Use <strong>simple colors and shapes</strong> for best performance
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">
            Prompting Best Practices
          </h3>
          <div className="space-y-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                1. Be Specific About Mechanics
              </h4>
              <p className="text-zinc-300 text-sm mb-2">
                Instead of: &quot;Make a fun game&quot;
              </p>
              <p className="text-zinc-300 text-sm">
                Try: &quot;Create a game where colored circles fall from the top
                and the player clicks matching colors to score points&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                2. Define Clear Win/Loss Conditions
              </h4>
              <p className="text-zinc-300 text-sm mb-2">
                Example: &quot;Player loses if they miss 3 circles. Each
                successful match adds 1 point. Game ends after 30 seconds with
                final score display.&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">3. Specify Visual Style</h4>
              <p className="text-zinc-300 text-sm mb-2">
                Example: &quot;Use a neon color palette with glowing effects.
                Background should be dark with particle effects.&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                4. Include Difficulty Progression
              </h4>
              <p className="text-zinc-300 text-sm mb-2">
                Example: &quot;Start with 2 falling objects per second, increase
                speed every 5 points scored.&quot;
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Example Prompts That Work Well
          </h2>
          <div className="space-y-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-1">
                ✓ Good Prompt
              </h4>
              <p className="text-zinc-300 text-sm italic mb-2">
                &quot;Create a bubble popping game where colorful bubbles rise
                from the bottom. Player clicks to pop them for 1 point each.
                Bubbles get faster every 10 points. Missing a bubble that
                reaches the top loses 1 life (start with 3 lives). Use pastel
                colors and smooth animations.&quot;
              </p>
              <p className="text-zinc-400 text-xs">
                Clear mechanics, scoring, difficulty curve, and visual style.
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-1">
                ✓ Good Prompt
              </h4>
              <p className="text-zinc-300 text-sm italic mb-2">
                &quot;Make a reaction time game: A circle appears randomly on
                screen every 1-3 seconds. Player must click it within 1 second
                to score. Circle gets smaller as score increases. Show remaining
                time and current score. Use high contrast colors for
                accessibility.&quot;
              </p>
              <p className="text-zinc-400 text-xs">
                Simple mechanic with clear challenge escalation.
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-1">✗ Poor Prompt</h4>
              <p className="text-zinc-300 text-sm italic mb-2">
                &quot;Make a platformer game like Mario&quot;
              </p>
              <p className="text-zinc-400 text-xs">
                Too vague, requires keyboard input, complex for 30-second
                format.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Building and Testing</h2>
          <p className="text-zinc-300">
            After creating your initial game, use the chat interface to refine
            it:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Test the game in the preview window</li>
            <li>
              Use the chat to request specific changes: &quot;Make the targets
              bigger&quot; or &quot;Add a countdown timer&quot;
            </li>
            <li>The AI will update your game in real-time</li>
            <li>Iterate until the gameplay feels just right</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">How Scoring Works</h2>
          <p className="text-zinc-300">
            Players earn points during gameplay. Remember:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-300 mt-2">
            <li>Points must increase by 1 at a time (no bulk scoring)</li>
            <li>Final score is recorded when the 30-second timer ends</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Tokens and Rewards</h2>
          <p className="text-zinc-300">
            When publishing a game you can mint a token that represents it. Set
            the name and symbol in the publish dialog. Tokens are distributed
            based on final scores, so top players collect the most.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Playing on Farcaster</h2>
          <p className="text-zinc-300">
            Games are played directly in the Farcaster feed. Share your game
            link and anyone can jump in, play and start earning points
            immediately. You can also share a /coin link so players can collect
            your token.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Version History</h2>
          <p className="text-zinc-300">
            Every build automatically stores a version whenever you make
            changes. Use the sidebar on the build page to view, restore or
            delete previous versions of your game.
          </p>
        </section>
      </main>
    </div>
  );
}
