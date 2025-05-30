'use client';

import { useState } from 'react';
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
import { CheckCircle } from 'lucide-react';

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

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCoinCreated, setIsCoinCreated] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string>('');
  const [rewardPoolAddress, setRewardPoolAddress] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

      // Close the dialog after successful transfer
      setOpen(false);

      // Call the callback to notify parent component
      if (onPoolFunded) {
        onPoolFunded();
      }
    } catch (error) {
      console.error('Error funding reward pool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          className="bg-white cursor-pointer"
          variant="secondary"
          size="lg"
        >
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a]">
        {isCoinCreated ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Reward Pool</DialogTitle>
              <DialogDescription>
                Review your token details and create the reward pool.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-center">
                You&apos;re about to create a reward pool for your game.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Once created, the reward pool will be available for
                distribution.
              </p>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                onClick={fundRewardPool}
                disabled={isLoading || !coinAddress || !rewardPoolAddress}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Funding Pool...' : 'Create Reward Pool'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Create Token</DialogTitle>
              <DialogDescription className="text-[#adadad]">
                Enter token details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] p-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] p-2 text-white"
                required
              />
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  className="bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Token'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
