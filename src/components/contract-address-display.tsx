'use client';

import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContractAddressDisplayProps {
  contractAddress: string;
}

export default function ContractAddressDisplay({
  contractAddress,
}: ContractAddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!contractAddress) return;

    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      toast.success('Contract address copied to clipboard!');

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying address:', error);
      toast.error('Failed to copy contract address');
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-white">Contract Address</h2>
      <div className="flex items-center gap-2 p-3 bg-[#21262d] rounded-lg border border-[#30363d]">
        <code className="text-sm text-[#c9d1d9] font-mono break-all select-all flex-1">
          {contractAddress}
        </code>
        <Button
          onClick={handleCopyAddress}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-[#30363d] text-[#c9d1d9] hover:text-white"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
