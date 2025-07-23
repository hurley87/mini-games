import Header from '@/components/header';

export const metadata = {
  title: 'Creator Playbook - Mini Games Studio',
  description:
    'Learn how to create tokenized mini games and earn rewards.',
};

/**
 * Detailed documentation for creators building mini games.
 * Covers the workflow, AI models, prompting strategies, scoring and token mechanics.
 */
export default function CreatorPlaybook() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto p-6 space-y-8">
        <section>
          <h1 className="text-3xl font-semibold mb-4">
            Creator Playbook: Earn Money with Mini Games
          </h1>
          <p className="text-zinc-300 mb-2">
            Use AI to generate fun game mechanics and assets in minutes.
          </p>
          <p className="text-zinc-300 mb-2">
            Publishing a game automatically creates a token that rewards players
            based on their scores.
          </p>
          <p className="text-zinc-300">
            Fund your reward pool by adding more tokens and keep an eye on the
            balance to maintain engagement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Game Constraints</h2>

          <h3 className="text-xl font-semibold mb-3">Technical Limits</h3>
          <div className="bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>
                <strong>Duration:</strong> 0-60 seconds per game session (0 =
                unlimited)
              </li>
              <li>
                <strong>Display:</strong> 400×750px mobile-optimized canvas
              </li>
              <li>
                <strong>Scoring:</strong> 1-100 points maximum, increase 1 point
                at a time
              </li>
              <li>
                <strong>Input:</strong> Mouse/tap only (no keyboard, swipes, or
                gestures)
              </li>
              <li>
                <strong>Environment:</strong> Sandboxed iframe with no external
                dependencies
              </li>
              <li>
                <strong>Performance:</strong> Use simple shapes and colors for
                best results
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-3">Creator Requirements</h3>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>
                <strong>Farcaster Account:</strong> Valid account required for
                authentication
              </li>
              <li>
                <strong>Neynar Score:</strong> Minimum score of 0.7 to create
                games
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Token Economics</h2>

          <h3 className="text-xl font-semibold mb-3">How Token Rewards Work</h3>
          <p className="text-zinc-300 mb-4">
            When you publish a game, you create a token with a reward pool.
            Players earn tokens based on their performance:
          </p>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20 mb-4">
            <h4 className="font-semibold text-white mb-2">Token Formula</h4>
            <p className="text-zinc-300 text-sm">
              <strong>Tokens Earned = Player Score × Token Multiplier</strong>
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              Example: 25 points × 1,000 multiplier = 25,000 tokens
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Configuration Options</h3>
          <div className="space-y-3">
            <div className="bg-zinc-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Token Multiplier</span>
                <span className="text-white font-medium">1x - 1,000,000x</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Converts points to tokens
              </p>
            </div>

            <div className="bg-zinc-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Premium Threshold</span>
                <span className="text-white font-medium">
                  1 - 10,000,000 tokens
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Minimum tokens for premium rewards
              </p>
            </div>

            <div className="bg-zinc-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Daily Play Limit</span>
                <span className="text-white font-medium">1 - 100 games</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Maximum games per player per day
              </p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">
            Reward Pool Management
          </h3>
          <p className="text-zinc-300 mb-3">
            Each game gets its own reward pool wallet address. You can add more
            tokens to increase rewards:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Launch your game to get a reward pool address</li>
            <li>Send additional tokens to this address to fund more rewards</li>
            <li>
              Players receive tokens directly from this pool when they play
            </li>
            <li>Monitor your pool balance in the Rewards dialog</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Writing Effective Prompts
          </h2>

          <h3 className="text-xl font-semibold mb-3">Essential Elements</h3>
          <div className="space-y-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">1. Core Mechanics</h4>
              <p className="text-zinc-300 text-sm mb-2">
                Be specific about how players interact with your game.
              </p>
              <p className="text-zinc-400 text-xs">
                Good: &quot;Click falling circles to score points&quot;
                <br />
                Bad: &quot;Make it fun&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">2. Scoring System</h4>
              <p className="text-zinc-300 text-sm mb-2">
                Define how points are earned and when the game ends.
              </p>
              <p className="text-zinc-400 text-xs">
                Example: &quot;1 point per successful click, game ends after 45
                seconds&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">3. Visual Style</h4>
              <p className="text-zinc-300 text-sm mb-2">
                Specify colors, themes, and visual effects.
              </p>
              <p className="text-zinc-400 text-xs">
                Example: &quot;Neon colors with particle effects on a dark
                background&quot;
              </p>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">4. Difficulty Progression</h4>
              <p className="text-zinc-300 text-sm mb-2">
                Describe how the game gets more challenging over time.
              </p>
              <p className="text-zinc-400 text-xs">
                Example: &quot;Speed increases every 10 points, smaller targets
                after 20 points&quot;
              </p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Example Prompts</h3>
          <div className="space-y-4">
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-emerald-400 mb-2">
                ✓ Excellent Prompt
              </h4>
              <p className="text-zinc-300 text-sm italic mb-2">
                &quot;Create a bubble-popping game where colorful bubbles float
                up from the bottom. Players tap bubbles to pop them for 1 point
                each. Bubbles move faster every 15 points. Game lasts 45
                seconds. Use pastel colors with smooth pop animations and gentle
                background music.&quot;
              </p>
              <p className="text-zinc-400 text-xs">
                Includes mechanics, scoring, progression, duration, and style.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-2">✗ Poor Prompt</h4>
              <p className="text-zinc-300 text-sm italic mb-2">
                &quot;Make a platformer like Mario with levels and
                power-ups&quot;
              </p>
              <p className="text-zinc-400 text-xs">
                Too complex, requires keyboard, doesn&apos;t fit mobile format.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Development Workflow</h2>
          <ol className="list-decimal list-inside space-y-3 text-zinc-300">
            <li>
              <strong>Create:</strong> Start with a clear prompt describing your
              game concept
            </li>
            <li>
              <strong>Test:</strong> Play your game in the preview window to
              check mechanics
            </li>
            <li>
              <strong>Iterate:</strong> Use chat to refine gameplay: &quot;Make
              targets bigger&quot; or &quot;Add particle effects&quot;
            </li>
            <li>
              <strong>Configure:</strong> Set up token rewards, multipliers, and
              game duration
            </li>
            <li>
              <strong>Launch:</strong> Publish your game with its token to start
              earning rewards
            </li>
            <li>
              <strong>Share:</strong> Post on Farcaster and watch players
              compete for tokens
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Publishing & Sharing</h2>
          <p className="text-zinc-300 mb-4">
            Once your game is ready, you can launch it with a token:
          </p>

          <div className="bg-zinc-800 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Token Name & Symbol</span>
              <span className="text-zinc-400 text-sm">
                Choose memorable branding
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Game Configuration</span>
              <span className="text-zinc-400 text-sm">
                Set duration, points, multipliers
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Reward Pool</span>
              <span className="text-zinc-400 text-sm">
                Gets unique wallet address
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Farcaster Integration</span>
              <span className="text-zinc-400 text-sm">
                Share directly in feed
              </span>
            </div>
          </div>

          <p className="text-zinc-300 mt-4">
            Your game will be playable directly in a Farcaster mini app, and
            players will automatically receive tokens based on their scores.
          </p>
        </section>
      </main>
    </div>
  );
}
