'use client';

import GameList from '@/components/build-list';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccount, useConnect } from 'wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { FloatingBubbles } from '@/components/floating-bubbles';
import { ChevronDown } from 'lucide-react';

export default function Home() {
  const { status: accountStatus, address } = useAccount();
  const { connectors, connect } = useConnect();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = () => {
    const coinbaseConnector = connectors.find(
      (connector) => connector.name === 'Coinbase Wallet'
    );
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

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
      let imageData: string | null = null;
      if (imageFile) {
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch('/api/create-build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          address,
          model,
          image: imageData,
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
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountStatus !== 'connected') {
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
            onClick={handleConnect}
            disabled={isSubmitting}
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 cursor-pointer"
          >
            Connect Wallet
          </Button>
        </div>
      </main>
    );
  }

  return (
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
          <div className="p-3 border-t border-gray-800">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
              className="text-sm text-gray-300 file:bg-gray-700 file:text-white file:px-2 file:py-1 file:rounded-md"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-3 max-h-48 w-full object-contain rounded"
              />
            )}
          </div>
          <div className="flex items-center justify-between p-3 border-t border-gray-800">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-sm cursor-pointer bg-gray-700 rounded-full"
                  >
                    Model: {model}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-[#2a2a2a] border-gray-800 text-white"
                >
                  <DropdownMenuItem
                    onClick={() => setModel('gpt-4.1')}
                    className="hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] cursor-pointer"
                  >
                    gpt-4.1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModel('gpt-4o')}
                    className="hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] cursor-pointer"
                  >
                    gpt-4o
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModel('gpt-4o-mini')}
                    className="hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] cursor-pointer"
                  >
                    gpt-4o-mini
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModel('gpt-4o-mini-high')}
                    className="hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] cursor-pointer"
                  >
                    gpt-4o-mini-high
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="lg"
                variant="secondary"
                className=" cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={isSubmitting || !address}
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
  );
}
