'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from 'viem';
import { base } from 'viem/chains';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createCoin, getCoinCreateFromLogs } from '@zoralabs/coins-sdk';
import {
  CheckCircle,
  Coins,
  Rocket,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

const PURCHASE_START_PRICE = '0.001';

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

export default function TokenDialog({
  buildId,
  onPoolFunded,
}: {
  buildId: string;
  onPoolFunded?: () => void;
}) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const address = (user?.wallet?.address || wallets[0]?.address) as
    | `0x${string}`
    | undefined;
  const wallet = wallets.find((w) => w.address === address) || wallets[0];

  console.log('wallet', wallet);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCoinCreated, setIsCoinCreated] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string>('');
  const [rewardPoolAddress, setRewardPoolAddress] = useState<string>('');
  const [isPoolFunded, setIsPoolFunded] = useState(false);
  const [isWrongChain, setIsWrongChain] = useState(false);

  // Helper function to check if wallet is on Base chain
  const checkChain = async () => {
    if (!wallet) return;

    try {
      const provider = await wallet.getEthereumProvider();
      if (!provider) return;

      const chainId = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId as string, 16);

      setIsWrongChain(currentChainId !== base.id);
    } catch (error) {
      console.error('Error checking chain:', error);
    }
  };

  // Check chain on mount and when wallet changes
  useEffect(() => {
    checkChain();

    // Set up chain change listener
    const setupChainListener = async () => {
      if (!wallet) return;

      try {
        const provider = await wallet.getEthereumProvider();
        if (!provider || !provider.on) return;

        const handleChainChanged = () => {
          checkChain();
        };

        provider.on('chainChanged', handleChainChanged);

        // Cleanup listener on unmount
        return () => {
          provider.removeListener('chainChanged', handleChainChanged);
        };
      } catch (error) {
        console.error('Error setting up chain listener:', error);
      }
    };

    setupChainListener();
  }, [wallet]);

  // Helper function to ensure wallet is on Base chain
  const ensureBaseChain = async () => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {
      const provider = await wallet.getEthereumProvider();
      if (!provider) {
        throw new Error('Unable to get wallet provider');
      }

      // Check current chain
      const chainId = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId as string, 16);

      // Base chain ID is 8453
      if (currentChainId !== base.id) {
        console.log('Switching to Base chain...');

        try {
          await wallet.switchChain(base.id);
          // Wait a bit for the chain switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verify the switch was successful
          const newChainId = await provider.request({ method: 'eth_chainId' });
          const verifiedChainId = parseInt(newChainId as string, 16);

          if (verifiedChainId !== base.id) {
            throw new Error('Failed to switch to Base chain');
          }

          toast.success('Switched to Base network');
          setIsWrongChain(false);
        } catch (switchError) {
          console.log('switchError', switchError);
          toast.error('Please add Base network to your wallet');
          setIsWrongChain(true);
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Error switching chain:', error);
      throw error;
    }
  };

  // Check for unpublished coin when component mounts
  useEffect(() => {
    const checkUnpublishedCoin = async () => {
      try {
        // Fetch the coin directly from the database without pool_initialized check
        const response = await fetch(`/api/coins/${buildId}/unpublished`);
        if (response.ok) {
          const data = await response.json();
          if (data.coin && !data.coin.pool_initialized) {
            // Set the state to show the pool initialization screen
            setCoinAddress(data.coin.coin_address);
            setRewardPoolAddress(data.coin.wallet_address);
            setIsCoinCreated(true);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error('Error checking unpublished coin:', error);
      }
    };

    checkUnpublishedCoin();
  }, [buildId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ensure wallet is on Base chain
      await ensureBaseChain();

      const res = await fetch('/api/create-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, symbol, buildId }),
      });
      const { uri, buildFid } = await res.json();
      if (uri) {
        setTitle('');
        setSymbol('');

        // Define the purchase amount - this will be used for both initialPurchaseWei and msg.value
        const purchaseAmount = parseEther(PURCHASE_START_PRICE);

        const coinParams = {
          name: title,
          symbol,
          uri,
          payoutRecipient: user?.wallet?.address as Address,
          initialPurchaseWei: purchaseAmount,
          platformReferrer:
            '0xBe523e724B9Ea7D618dD093f14618D90c4B19b0c' as Address,
        };

        const provider = await wallet.getEthereumProvider();

        if (!provider) {
          console.log('Unable to get wallet provider');
          return;
        }

        const walletClient = await createWalletClient({
          account: address,
          chain: base,
          transport: custom(provider),
        });

        const result = await createCoin(coinParams, walletClient, publicClient);

        const coinDeployment = getCoinCreateFromLogs(result.receipt);
        const coinData = {
          name: title,
          symbol,
          address: coinDeployment?.coin,
          build_id: buildId,
          fid: buildFid,
          purchase: PURCHASE_START_PRICE,
        };

        // Store the coin data in the database
        try {
          const coinResponse = await fetch('/api/create-coin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coinData),
          });

          if (!coinResponse.ok) {
            const errorData = await coinResponse.json();
            console.error('Failed to store coin data:', errorData);
            throw new Error(`Failed to store coin data: ${errorData.error}`);
          }

          const coinResult = await coinResponse.json();
          console.log('Coin successfully stored:', coinResult);

          // Store addresses for reward pool funding
          setCoinAddress(coinDeployment?.coin || '');
          setRewardPoolAddress(coinResult.coin?.wallet_address || '');
        } catch (error) {
          console.error('Error storing coin data:', error);
          // Note: We still show success to user since the coin was created on-chain
          // but log the database storage error
        }

        setIsCoinCreated(true);
      }
    } catch (err) {
      console.error('Error creating token', err);
      if (err instanceof Error && err.message.includes('chain')) {
        toast.error('Please switch to Base network to continue');
      } else {
        toast.error('Error creating token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fundRewardPool = async () => {
    console.log('Creating reward pool');

    if (!coinAddress || !rewardPoolAddress) {
      console.error('Missing coin address or reward pool address');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure wallet is on Base chain
      await ensureBaseChain();

      const provider = await wallet.getEthereumProvider();

      if (!provider) {
        console.log('Unable to get wallet provider');
        setIsLoading(false);
        return;
      }

      const walletClient = createWalletClient({
        account: address,
        chain: base,
        transport: custom(provider),
      });

      // Get the token balance from user's wallet
      const balance = await publicClient.readContract({
        address: coinAddress as Address,
        abi: [
          {
            inputs: [{ name: 'account', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'balanceOf',
        args: [address as Address],
      });

      console.log('User token balance:', balance.toString());

      if (balance === BigInt(0)) {
        console.log('No tokens to transfer');
        setIsLoading(false);
        return;
      }

      // Transfer all tokens to the reward pool
      const transferHash = await walletClient.writeContract({
        address: coinAddress as Address,
        abi: [
          {
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ] as const,
        functionName: 'transfer',
        args: [rewardPoolAddress as Address, balance],
        account: address as Address,
      });

      console.log('Transfer transaction hash:', transferHash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transferHash,
      });

      console.log('Transfer confirmed:', receipt);

      // Update pool initialization status
      try {
        const response = await fetch(`/api/coins/${buildId}/pool-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poolInitialized: true }),
        });

        if (!response.ok) {
          console.error('Failed to update pool status');
        }
      } catch (error) {
        console.error('Error updating pool status:', error);
      }

      // Mark pool as funded
      setIsPoolFunded(true);

      // Close the dialog after successful transfer
      setOpen(false);

      // Call the callback to notify parent component
      if (onPoolFunded) {
        onPoolFunded();
      }
    } catch (error) {
      console.error('Error funding reward pool:', error);
      if (error instanceof Error && error.message.includes('chain')) {
        toast.error('Please switch to Base network to continue');
      } else {
        toast.error('Error funding reward pool');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing if coin is created but pool not funded
    if (!newOpen && isCoinCreated && !isPoolFunded) {
      return;
    }

    // Reset state when closing after successful pool funding
    if (!newOpen && isPoolFunded) {
      setIsCoinCreated(false);
      setIsPoolFunded(false);
      setCoinAddress('');
      setRewardPoolAddress('');
      setTitle('');
      setSymbol('');
    }

    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button
          className="bg-white text-black hover:bg-gray-100 cursor-pointer"
          size="lg"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Launch Game
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a] border-gray-800">
        {isCoinCreated ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 p-3 bg-[#30363d] rounded-full">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <DialogTitle className="text-xl font-bold text-center text-white">
                Token Created Successfully
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400 mt-2">
                Your game token is live on Base
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              {isWrongChain && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                  <p className="text-sm text-orange-300 text-center">
                    ⚠️ Please switch to Base network to continue
                  </p>
                </div>
              )}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="font-semibold text-white">
                    Next Step: Initialize Rewards
                  </h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Create a reward pool to enable token distribution to your
                  players. This pool will be used to incentivize gameplay and
                  reward achievements. You can always add more funds to the pool
                  later.
                </p>
              </div>
              {!isPoolFunded && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                  <p className="text-sm text-orange-300 text-center">
                    ⚠️ You must initialize the reward pool to launch
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span>Token deployed</span>
                </div>
                <ArrowRight className="h-4 w-4" />
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-600 rounded-full mr-2" />
                  <span>Initialize rewards</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                size="lg"
                onClick={fundRewardPool}
                disabled={isLoading || !coinAddress || !rewardPoolAddress}
                className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Reward Pool...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Initialize Reward Pool
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 p-3 bg-[#30363d] rounded-full">
                <Coins className="h-10 w-10 text-gray-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-center text-white">
                Launch Your Game Token
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400 mt-2">
                {`Create a unique token for your game's economy`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {isWrongChain && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                  <p className="text-sm text-orange-300 text-center">
                    ⚠️ Please switch to Base network to continue
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Token Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Space Credits"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500">
                  Choose a memorable name for your game token
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Token Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g., SPACE"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
                  required
                  maxLength={6}
                />
                <p className="text-xs text-gray-500">
                  3-6 characters, typically uppercase
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#30363d]">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-300">
                    <p className="font-medium mb-1">Launch details:</p>
                    <ul className="space-y-1 text-gray-500">
                      <li>• Initial purchase: {PURCHASE_START_PRICE} ETH</li>
                      <li>• Deployed on Base network</li>
                      <li>• Earn fees from trades</li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !title || !symbol}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Token...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Create Game Token
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
