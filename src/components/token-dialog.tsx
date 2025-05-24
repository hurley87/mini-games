'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TokenDialogProps {
  buildImage?: string
}

export default function TokenDialog({ buildImage }: TokenDialogProps) {
  const [open, setOpen] = useState(false)
  const [header, setHeader] = useState('')
  const [description, setDescription] = useState('')
  const [symbol, setSymbol] = useState('')
  const [image, setImage] = useState(buildImage || '')

  useEffect(() => {
    setImage(buildImage || '')
  }, [buildImage])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, description, symbol, image }),
      })
      const data = await res.json()
      console.log('create-token response', data)
      if (data.success) {
        setOpen(false)
      }
    } catch (err) {
      console.error('Error creating token', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white cursor-pointer" variant="secondary" size="lg">
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-white">Create Token</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Header"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] p-2 text-white"
            required
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#30363d] text-white"
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
          <input
            type="text"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a] p-2 text-white"
            required
          />
          {image && (
            <img src={image} alt="Token" className="h-32 w-full rounded object-cover" />
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="bg-white text-black">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

