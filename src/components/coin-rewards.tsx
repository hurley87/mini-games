'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Coins, Copy, Check, Save, Settings } from 'lucide-react';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';
import { formatEther } from 'viem';

interface CoinRewardsProps {
  coinAddress: string;
  walletAddress: string;
  symbol: string;
  buildId?: string;
}

interface CoinConfig {
  duration: number;
  max_points: number;
  token_multiplier: number;
  premium_threshold: number;
  max_players: number;
}

// Utility function to format numbers in human-readable format
const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return Math.floor(num / 1_000_000_000) + 'B';
  }
  if (num >= 1_000_000) {
    return Math.floor(num / 1_000_000) + 'M';
  }
  if (num >= 1_000) {
    return Math.floor(num / 1_000) + 'K';
  }
  return Math.floor(num).toString();
};

export default function CoinRewards({
  coinAddress,
  walletAddress,
  symbol,
  buildId,
}: CoinRewardsProps) {
  const [balance, setBalance] = useState<string>('0');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'config'>('rewards');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Coin configuration state
  const [coinConfig, setCoinConfig] = useState<CoinConfig>({
    duration: 30,
    max_points: 50,
    token_multiplier: 1000,
    premium_threshold: 100000,
    max_players: 10,
  });

  // Form state for editing
  const [formConfig, setFormConfig] = useState<CoinConfig>(coinConfig);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch RPC URL from server
  useEffect(() => {
    const fetchRpcUrl = async () => {
      try {
        const response = await fetch('/api/rpc-url');
        if (response.ok) {
          const data = await response.json();
          setRpcUrl(data.rpcUrl);
        } else {
          console.error('Failed to fetch RPC URL');
        }
      } catch (error) {
        console.error('Error fetching RPC URL:', error);
      }
    };

    fetchRpcUrl();
  }, []);

  // Fetch coin configuration
  useEffect(() => {
    const fetchCoinConfig = async () => {
      if (!buildId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/coins/${buildId}`);
        if (response.ok) {
          const data = await response.json();
          const config = {
            duration: data.duration || 30,
            max_points: data.max_points || 50,
            token_multiplier: data.token_multiplier || 1000,
            premium_threshold: data.premium_threshold || 100000,
            max_players: data.max_players || 10,
          };
          setCoinConfig(config);
          setFormConfig(config);
        }
      } catch (error) {
        console.error('Error fetching coin config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoinConfig();
  }, [buildId]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || !coinAddress || !rpcUrl) return;

      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(rpcUrl),
        });

        console.log('coinAddress', coinAddress);
        console.log('walletAddress', walletAddress);
        console.log('rpcUrl', rpcUrl);

        const balanceResult = await publicClient.readContract({
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
          args: [walletAddress as Address],
        });

        // Format the balance to a readable format (assuming 18 decimals)
        const formattedBalance = formatEther(balanceResult);
        setBalance(formatNumber(parseFloat(formattedBalance)));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      }
    };

    fetchBalance();
  }, [coinAddress, walletAddress, rpcUrl]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(coinConfig).some(
      (key) =>
        coinConfig[key as keyof CoinConfig] !==
        formConfig[key as keyof CoinConfig]
    );
    setHasChanges(changed);
  }, [coinConfig, formConfig]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConfigChange = (field: keyof CoinConfig, value: number) => {
    setFormConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateConfig = (config: CoinConfig): boolean => {
    return (
      config.duration >= 0 &&
      config.duration <= 60 &&
      config.max_points >= 1 &&
      config.max_points <= 100 &&
      config.token_multiplier >= 1 &&
      config.token_multiplier <= 1000000 &&
      config.premium_threshold >= 1 &&
      config.premium_threshold <= 10000000 &&
      config.max_players >= 1 &&
      config.max_players <= 100
    );
  };

  const handleSave = async () => {
    if (!buildId || !validateConfig(formConfig)) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/coins/${buildId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formConfig),
      });

      if (response.ok) {
        setCoinConfig(formConfig);
        setHasChanges(false);
      } else {
        console.error('Failed to save coin configuration');
      }
    } catch (error) {
      console.error('Error saving coin configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormConfig(coinConfig);
    setHasChanges(false);
  };

  const ConfigInput = ({
    label,
    field,
    min,
    max,
    suffix = '',
  }: {
    label: string;
    field: keyof CoinConfig;
    min: number;
    max: number;
    suffix?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={formConfig[field]}
          onChange={(e) =>
            handleConfigChange(field, parseInt(e.target.value) || min)
          }
          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suffix && <span className="text-sm text-[#adadad]">{suffix}</span>}
      </div>
      <div className="text-xs text-[#adadad]">
        Range: {min} - {max}
        {suffix}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-10 bg-transparent cursor-pointer"
          variant="outline"
          size="lg"
        >
          <Coins className="w-4 h-4 mr-2" />
          Rewards
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a] max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Coin Management</DialogTitle>
          <DialogDescription className="text-[#adadad]">
            View your rewards and configure coin settings
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'rewards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('rewards')}
            className="flex-1 border text-white cursor-pointer"
          >
            <Coins className="w-4 h-4 mr-2" />
            Rewards
          </Button>
          <Button
            variant={activeTab === 'config' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('config')}
            className="flex-1 border text-white cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Config
          </Button>
        </div>

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="py-6 space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {balance} ${symbol.toUpperCase()}
              </div>
              <div className="text-sm text-[#adadad]">
                Current reward pool balance
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-white">
                Reward Pool Address:
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#30363d]">
                <code className="text-sm text-[#adadad] flex-1 font-mono">
                  {formatAddress(walletAddress)}
                </code>
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-[#30363d]"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#adadad]" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-[#adadad]">
                {`This is your game's reward pool address where players can receive
                tokens.`}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="py-6 space-y-6">
            {isLoading ? (
              <div className="text-center text-[#adadad]">
                Loading configuration...
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <ConfigInput
                    label="Game Duration"
                    field="duration"
                    min={0}
                    max={60}
                    suffix="seconds"
                  />

                  <ConfigInput
                    label="Maximum Points"
                    field="max_points"
                    min={1}
                    max={100}
                    suffix="points"
                  />

                  <ConfigInput
                    label="Token Multiplier"
                    field="token_multiplier"
                    min={1}
                    max={1000000}
                  />

                  <ConfigInput
                    label="Premium Threshold"
                    field="premium_threshold"
                    min={1}
                    max={10000000}
                    suffix="tokens"
                  />

                  <ConfigInput
                    label="Maximum Players"
                    field="max_players"
                    min={1}
                    max={100}
                    suffix="players"
                  />
                </div>

                {/* Action Buttons */}
                {hasChanges && (
                  <div className="flex gap-3 pt-4 border-t border-[#30363d]">
                    <Button
                      onClick={handleCancel}
                      variant="ghost"
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1"
                      disabled={isSaving || !validateConfig(formConfig)}
                    >
                      {isSaving ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
