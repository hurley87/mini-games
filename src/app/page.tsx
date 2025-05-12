"use client";

import Chat from "@/components/chat";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "wagmi";

export default function Home() {
  const { status: accountStatus } = useAccount();
  return (
    <div className="flex flex-col items-center justify-between h-screen">
      <div className="max-w-2xl w-full h-full flex flex-col">
        <div className="flex justify-between w-full py-4">
          <h1 className="text-2xl font-bold">Mini Games Studio</h1>
          <WalletConnect />
        </div>
        <div className="flex-1 min-h-0 w-full">
          {accountStatus === "connected" && (
            <Chat />
          )}
        </div>
      </div>
    </div>
  );
}
