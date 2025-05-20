'use client';

import GameList from '@/components/build-list';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { status: accountStatus, address } = useAccount();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  console.log('accountStatus', accountStatus);

  const handleSubmit = async () => {
    if (!address) {
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
          description: description.trim(),
          address,
        }),
      });

      const { data } = await response.json();

      const build = data[0];

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create build');
      }

      router.push(`/build/${build.id}`);

      toast.success('Build request submitted successfully');
      setDescription(''); // Clear the textarea
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            placeholder="Describe another task"
            className="border-none bg-transparent min-h-[120px] p-4 text-white resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-end p-3 border-t border-gray-800">
            <Button
              size="lg"
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting || !address}
            >
              {isSubmitting ? 'Submitting...' : 'Build'}
            </Button>
          </div>
        </div>

        {/* Games list */}
        <GameList />
      </div>
    </main>
  );
}
