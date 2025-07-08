'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle,
  Coins,
  Rocket,
  ArrowRight,
  Loader2,
  ExternalLink,
  Copy,
  X,
  Settings,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CoinConfig {
  duration: number;
  max_points: number;
  token_multiplier: number;
  premium_threshold: number;
  max_plays: number;
}

interface CreatedTokenData {
  tokenAddress?: string;
  transactionHash?: string;
  tokenName: string;
  tokenSymbol: string;
  network: string;
  walletAddress?: string;
}

export default function TokenDialog({ buildId }: { buildId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCoinCreated, setIsCoinCreated] = useState(false);
  const [createdTokenData, setCreatedTokenData] =
    useState<CreatedTokenData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>(
    'overview'
  );
  const [copied, setCopied] = useState(false);

  // Coin configuration state
  const [coinConfig, setCoinConfig] = useState<CoinConfig>({
    duration: 30,
    max_points: 50,
    token_multiplier: 1000,
    premium_threshold: 100000,
    max_plays: 10,
  });

  // Fetch build data to get tutorial for description
  useEffect(() => {
    const fetchBuildData = async () => {
      try {
        const response = await fetch(`/api/build-status?buildId=${buildId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.tutorial) {
            setDescription(result.data.tutorial);
          }
        }
      } catch (error) {
        console.error('Error fetching build data:', error);
      }
    };

    if (buildId) {
      fetchBuildData();
    }
  }, [buildId]);

  const handleConfigChange = (field: keyof CoinConfig, value: number) => {
    setCoinConfig((prev) => ({
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
      config.max_plays >= 1 &&
      config.max_plays <= 100
    );
  };

  const validateSymbol = (symbol: string): boolean => {
    return symbol.length >= 3 && symbol.length <= 8;
  };

  const resetDialogState = () => {
    setIsCoinCreated(false);
    setCreatedTokenData(null);
    setTitle('');
    setSymbol('');
    setDescription('');
    setActiveTab('overview');
    setCopied(false);
    setCoinConfig({
      duration: 30,
      max_points: 50,
      token_multiplier: 1000,
      premium_threshold: 100000,
      max_plays: 10,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCloseDialog = () => {
    resetDialogState();
    setOpen(false);
  };

  const handleShareGame = () => {
    const shareUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(
      `Check out this new game I created with ${createdTokenData?.tokenName} rewards!`
    )}&embeds[]=${encodeURIComponent(
      `https://app.minigames.studio/coins/${buildId}`
    )}`;
    window.open(shareUrl, '_blank');
  };

  const ConfigInput = ({
    label,
    field,
    min,
    max,
    suffix = '',
    description,
  }: {
    label: string;
    field: keyof CoinConfig;
    min: number;
    max: number;
    suffix?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={coinConfig[field]}
          onChange={(e) =>
            handleConfigChange(field, parseInt(e.target.value) || min)
          }
          className="flex-1 rounded-md border border-[#30363d] bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First send all form data to the new coins endpoint
      const formData = {
        title,
        symbol,
        description,
        duration: coinConfig.duration,
        max_points: coinConfig.max_points,
        token_multiplier: coinConfig.token_multiplier,
        premium_threshold: coinConfig.premium_threshold,
        max_plays: coinConfig.max_plays,
      };

      const coinsResponse = await fetch(`/api/coins/${buildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (coinsResponse.ok) {
        const coinsResult = await coinsResponse.json();
        console.log('Form data sent successfully:', coinsResult);

        // Set created token data with response info
        setCreatedTokenData({
          tokenAddress:
            coinsResult.tokenAddress || coinsResult.coin?.coin_address,
          transactionHash: coinsResult.transactionHash,
          tokenName: title,
          tokenSymbol: symbol,
          network: 'Base Mainnet',
          walletAddress:
            coinsResult.walletAddress || coinsResult.coin?.wallet_address,
        });

        router.push(`/coins/${coinsResult.coin?.id}`);
        toast.success('Token created successfully!');
      } else {
        const errorResult = await coinsResponse.json();
        throw new Error(errorResult.error || 'Failed to create token');
      }
    } catch (err) {
      console.error('Error creating token', err);
      if (err instanceof Error && err.message.includes('chain')) {
        toast.error('Please switch to Base network to continue');
      } else if (err instanceof Error) {
        toast.error(`Error creating token: ${err.message}`);
      } else {
        toast.error('Error creating token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCloseDialog();
    } else {
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <div className="bg-white text-black hover:bg-gray-100 cursor-pointer flex items-center justify-center px-4 py-2 rounded-md">
          <Rocket className="mr-2 h-4 w-4" />
          Launch Game
        </div>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a] border-gray-800 max-w-lg max-h-[80vh] overflow-y-auto">
        {isCoinCreated && createdTokenData ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-white">
                    🎉 Game Token Live!
                  </DialogTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDialog}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-gray-400">
                Your {createdTokenData.tokenName} (
                {createdTokenData.tokenSymbol}) token is ready for players
              </DialogDescription>
            </DialogHeader>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="flex-1 border text-white cursor-pointer"
              >
                <Coins className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'details' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('details')}
                className="flex-1 border text-white cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Details
              </Button>
            </div>

            <div className="py-6 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {createdTokenData.tokenName}
                    </div>
                    <div className="text-lg text-gray-300 mb-1">
                      ${createdTokenData.tokenSymbol}
                    </div>
                    <div className="text-sm text-gray-500">
                      Token ready for gameplay rewards
                    </div>
                  </div>

                  {createdTokenData.walletAddress && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white">
                        Reward Pool Address:
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#30363d]">
                        <code className="text-sm text-gray-400 flex-1 font-mono">
                          {formatAddress(createdTokenData.walletAddress)}
                        </code>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              createdTokenData.walletAddress!,
                              'Wallet address'
                            )
                          }
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-[#30363d]"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Players will receive tokens from this address when they
                        play your game
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <h3 className="font-semibold text-white">
                        Ready to Go Live!
                      </h3>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">
                      Your game token is deployed and ready. Players can now
                      earn {createdTokenData.tokenSymbol} tokens by playing your
                      game.
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 bg-[#1a1a1a] rounded-md p-3 border border-gray-700">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <span>Token deployed</span>
                      </div>
                      <ArrowRight className="h-3 w-3" />
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <span>Pool initialized</span>
                      </div>
                      <ArrowRight className="h-3 w-3" />
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <span>Ready to play</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <>
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 space-y-3">
                    <h3 className="font-semibold text-white flex items-center">
                      <Coins className="h-4 w-4 mr-2" />
                      Token Information
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white font-medium">
                          {createdTokenData.tokenName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Symbol:</span>
                        <span className="text-white font-medium">
                          {createdTokenData.tokenSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Network:</span>
                        <span className="text-white font-medium">
                          {createdTokenData.network}
                        </span>
                      </div>

                      {createdTokenData.tokenAddress && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Address:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono text-xs">
                              {formatAddress(createdTokenData.tokenAddress)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  createdTokenData.tokenAddress!,
                                  'Token address'
                                )
                              }
                              className="h-6 w-6 p-0 hover:bg-gray-700"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://basescan.org/token/${createdTokenData.tokenAddress}`,
                                  '_blank'
                                )
                              }
                              className="h-6 w-6 p-0 hover:bg-gray-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 space-y-3">
                    <h3 className="font-semibold text-white">
                      Game Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <div className="text-white font-medium">
                          {coinConfig.duration}s
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Max Points:</span>
                        <div className="text-white font-medium">
                          {coinConfig.max_points}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Token Multiplier:</span>
                        <div className="text-white font-medium">
                          {coinConfig.token_multiplier.toLocaleString()}x
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Daily Plays:</span>
                        <div className="text-white font-medium">
                          {coinConfig.max_plays}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="space-y-2">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() =>
                    window.open(
                      `https://zora.co/coin/base:${createdTokenData.tokenAddress}`,
                      '_blank'
                    )
                  }
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-900 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Trade
                </Button>
                <Button
                  onClick={handleShareGame}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 cursor-pointer"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Game
                </Button>
              </div>
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
                {`Create a unique token for your game's economy. Each game starts with 10 million tokens.`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Token Basic Info */}
              <div className="space-y-4">
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
                    className={`w-full rounded-md border bg-[#1a1a1a] px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                      symbol && !validateSymbol(symbol)
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                        : 'border-[#30363d] focus:border-gray-600 focus:ring-gray-600'
                    }`}
                    required
                    maxLength={8}
                  />
                  <p
                    className={`text-xs ${
                      symbol && !validateSymbol(symbol)
                        ? 'text-red-400'
                        : 'text-gray-500'
                    }`}
                  >
                    3-8 characters, typically uppercase
                  </p>
                </div>
              </div>

              {/* Game Configuration */}
              <div className="space-y-4">
                <ConfigInput
                  label="Game Duration"
                  field="duration"
                  min={0}
                  max={60}
                  description="How long each game session lasts (0 = unlimited)"
                />

                <ConfigInput
                  label="Maximum Points"
                  field="max_points"
                  min={1}
                  max={100}
                  description="Maximum points a player can earn per game"
                />

                <ConfigInput
                  label="Token Multiplier"
                  field="token_multiplier"
                  min={1}
                  max={1000000}
                  description="Multiplier for converting points to tokens"
                />

                <ConfigInput
                  label="Premium Threshold"
                  field="premium_threshold"
                  min={1}
                  max={10000000}
                  description="Minimum tokens needed for premium rewards"
                />

                <ConfigInput
                  label="Maximum Daily Plays"
                  field="max_plays"
                  min={1}
                  max={100}
                  description="Maximum games a player can play per day"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={
                    isLoading ||
                    !title ||
                    !symbol ||
                    !validateSymbol(symbol) ||
                    !validateConfig(coinConfig)
                  }
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
