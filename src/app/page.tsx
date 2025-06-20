'use client';

import GameList from '@/components/build-list';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/header';
import { useLogin, usePrivy } from '@privy-io/react-auth';
import WhitelistCheck from '@/components/whitelist-check';
import { BuildProvider, useBuilds } from '@/lib/build-context';
import { FloatingBubbles } from '@/components/floating-bubbles';

function HomeContent() {
  const { ready, authenticated, user } = usePrivy();
  const { addBuild } = useBuilds();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fid = user?.farcaster?.fid;
  const { login } = useLogin({
    onComplete: async (params) => {
      console.log('User logged in successfully', params.user);
      const creator = params.user;
      const fid = creator.farcaster?.fid;

      if (!fid) {
        toast.error('Farcaster ID not found');
        return;
      }

      try {
        const response = await fetch('/api/creators', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fid,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create profile');
        }
      } catch (error) {
        console.error('Failed to create profile:', error);
      }
    },
    onError: (error) => {
      console.error('Login failed', error);
      // Show error message
    },
  });

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/create-build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          fid,
          model: 'gpt-4.1',
        }),
      });

      const { success, message, data } = await response.json();

      if (!success) {
        toast.error(message);
        return;
      }

      // Extract build data from response
      let buildData;
      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          buildData = data[0];
        } else {
          console.warn('API returned an empty array for build data');
          toast.error('No build data received from server');
          return;
        }
      } else if (data) {
        buildData = data;
      } else {
        console.warn('No build data received from API');
        toast.error('No build data received from server');
        return;
      }

      // Only show success message and clear input after validating build data
      toast.success('Build created! Generation started...');
      setDescription('');

      // Add build with actual API values, not hardcoded ones
      addBuild({
        id: buildData.id,
        title: buildData.title,
        html: buildData.html,
        created_at: buildData.created_at,
        model: buildData.model,
        image: buildData.image,
        isPublished: buildData.isPublished ?? false,
        status: buildData.status,
        error_message: buildData.error_message,
        coin: buildData.coin ?? null,
      });
    } catch (error) {
      console.error('Error creating build', error);
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <FloatingBubbles />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <FloatingBubbles />
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Play It in the Feed.</h1>

          <p className="text-zinc-300 mb-8 max-w-md text-lg">
            {`Mini Games Studio lets anyone spin up a game with AI and share it
            instantly. Each game is tokenized so your fans can tap in and back
            what you're building.`}
          </p>

          <Button
            onClick={login}
            disabled={isSubmitting}
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 cursor-pointer"
          >
            Get Started
          </Button>
        </div>
      </main>
    );
  }

  return (
    <WhitelistCheck>
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center pt-16 p-4">
          <div className="w-full max-w-3xl">
            <h1 className="text-3xl font-semibold text-center mb-8">
              What game are we building next?
            </h1>

            {/* Input area */}
            <div className="bg-[#2a2a2a] rounded-lg overflow-hidden mb-6">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your game idea"
                className="border-none bg-transparent min-h-[120px] p-4 text-white resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-end p-3 border-t border-gray-800">
                <Button
                  size="lg"
                  variant="secondary"
                  className=" cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !user}
                >
                  {isSubmitting ? 'Building...' : 'Build Game'}
                </Button>
              </div>
            </div>

            {/* Games list */}
            <GameList />
          </div>
        </main>
      </div>
    </WhitelistCheck>
  );
}

export default function Home() {
  return (
    <BuildProvider>
      <HomeContent />
    </BuildProvider>
  );
}
