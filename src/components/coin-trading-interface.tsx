'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuyCoin from '@/components/buy-coin';

interface CoinTradingInterfaceProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image?: string;
    coin_address: string;
  };
  ethBalance?: string;
}

export default function CoinTradingInterface({
  coin,
  ethBalance = '0',
}: CoinTradingInterfaceProps) {
  const [buyAmount, setBuyAmount] = useState('0.000111');
  const [sellAmount, setSellAmount] = useState('0.000111');

  const handleQuickBuyAmount = (amount: string) => {
    setBuyAmount(amount);
  };

  const handleQuickSellPercentage = (percentage: number) => {
    // For now, just set a placeholder amount
    // In a real implementation, this would calculate based on the user's coin balance
    setSellAmount((percentage * 0.001).toFixed(6));
  };

  return (
    <div className="pt-0">
      {/* Trading Interface */}
      <Tabs defaultValue="buy" className="space-y-4">
        {/* Buy/Sell Tabs */}
        <TabsList className="grid w-full grid-cols-2 bg-[#21262d] h-auto p-1">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-[#c9d1d9] py-2"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-[#c9d1d9] py-2"
          >
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-4">
          {/* Balance */}
          <div className="text-right">
            <span className="text-sm text-[#adadad]">Balance </span>
            <span className="text-sm text-white font-medium">
              {ethBalance} ETH
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-4">
              <input
                type="text"
                placeholder="0.000111"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="bg-transparent text-2xl text-white font-medium outline-none flex-1"
              />
              <div className="flex items-center gap-2 text-[#c9d1d9]">
                <span className="font-medium">ETH</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickBuyAmount('0.001')}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                0.001 ETH
              </button>
              <button
                onClick={() => handleQuickBuyAmount('0.01')}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                0.01 ETH
              </button>
              <button
                onClick={() => handleQuickBuyAmount('0.1')}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                0.1 ETH
              </button>
            </div>

            {/* Buy Component */}
            <div className="mt-6">
              <BuyCoin
                coinAddress={coin.coin_address}
                coinSymbol={coin.symbol}
                coinName={coin.name}
                amount={buyAmount}
                onSuccess={() => {
                  // Reset the amount after successful purchase
                  setBuyAmount('0.000111');
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-4">
          {/* Balance */}
          <div className="text-right">
            <span className="text-sm text-[#adadad]">Balance </span>
            <span className="text-sm text-white font-medium">
              0 {coin.symbol}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-4">
              <input
                type="text"
                placeholder="0.000111"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="bg-transparent text-2xl text-white font-medium outline-none flex-1"
              />
              <div className="flex items-center gap-2 text-[#c9d1d9]">
                {coin.image && (
                  <img
                    src={coin.image}
                    alt={coin.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="font-medium">{coin.symbol}</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickSellPercentage(0.25)}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                25%
              </button>
              <button
                onClick={() => handleQuickSellPercentage(0.5)}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => handleQuickSellPercentage(0.75)}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                75%
              </button>
              <button
                onClick={() => handleQuickSellPercentage(1)}
                className="py-2 px-3 text-sm text-[#c9d1d9] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors"
              >
                Max
              </button>
            </div>

            {/* Sell Button - Coming Soon */}
            <button
              className="w-full py-4 bg-gray-400 text-gray-700 font-semibold rounded-lg cursor-not-allowed mt-6"
              disabled
            >
              Sell (Coming Soon)
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
