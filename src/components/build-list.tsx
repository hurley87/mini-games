'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

type Build = {
  id: string;
  title: string;
  html: string;
  created_at: string;
  model?: string; // Optional model field
};

export default function BuildList() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBuilds = async () => {
    try {
      const response = await fetch('/api/builds');
      if (!response.ok) {
        throw new Error('Failed to fetch builds');
      }
      const data = await response.json();
      setBuilds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this build?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/builds/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete build');
      }

      // Refresh the builds list
      await fetchBuilds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between w-full bg-[#2a2a2a] rounded-lg p-4 animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-32"></div>
              <div className="h-3 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-700 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {builds.map((build) => (
        <div
          key={build.id}
          className="flex items-start justify-between group w-full bg-[#2a2a2a] rounded-lg p-4 hover:bg-[#333333] transition-colors"
        >
          <Link href={`/build/${build.id}`} className="flex-1">
            <div>
              <h3 className="font-medium text-white">{build.title}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {formatDistanceToNow(new Date(build.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {build.model && (
              <Badge
                variant="outline"
                className="bg-blue-900/30 text-blue-400 border-blue-800 flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                {build.model}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="bg-purple-900/30 text-purple-400 border-purple-800 flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Draft
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
              onClick={() => handleDelete(build.id)}
              disabled={deletingId === build.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
