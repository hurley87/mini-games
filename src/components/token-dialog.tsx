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
import { Textarea } from '@/components/ui/textarea';

export default function TokenDialog() {
  const [open, setOpen] = useState(false);
  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');
  const [symbol, setSymbol] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, description, symbol }),
      });
      const data = await res.json();
      console.log('create-token response', data);
      if (data.success) {
        setOpen(false);
      }
    } catch (err) {
      console.error('Error creating token', err);
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
        <DialogHeader>
          <DialogTitle className="text-white">Create Token</DialogTitle>
          <DialogDescription className="text-[#adadad]">
            Enter token details
          </DialogDescription>
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
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              className="bg-white text-black"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
