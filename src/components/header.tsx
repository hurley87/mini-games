'use client'

import { WalletConnect } from './wallet-connect'

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full border-b bg-white px-6 py-4">
      <h1 className="text-xl font-semibold">Mini Games Studio</h1>
      <WalletConnect />
    </header>
  )
}
