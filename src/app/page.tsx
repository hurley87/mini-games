"use client";

import Chat from "@/components/chat";
import Header from "@/components/header";
import { useAccount } from "wagmi";

export default function Home() {
  const { status: accountStatus } = useAccount();
  return (
    <div className="flex flex-col min-h-screen items-center">
      <Header />
      <main className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <h2 className="text-center text-lg font-semibold my-4">What are we build next?</h2>
        {accountStatus === "connected" && <Chat />}
      </main>
    </div>
  );
}
