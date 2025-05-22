'use client';

import { Badge } from '@/components/ui/badge';
import DeleteBuildButton from '@/components/delete-build-button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Build = {
  id: string;
  title: string;
  html: string;
  created_at: string;
  model?: string;
  image?: string;
};

export default function BuildList() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-stretch justify-between w-full bg-[#2a2a2a] rounded-lg overflow-hidden animate-pulse"
          >
            <div className="w-24 bg-gray-700" />
            <div className="p-4 flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-700 rounded w-24" />
            </div>
            <div className="p-4 h-6 bg-gray-700 rounded w-24" />
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
          className="flex items-stretch justify-between group w-full bg-[#2a2a2a] rounded-lg overflow-hidden hover:bg-[#333333] transition-colors"
        >
          <Link
            href={`/build/${build.id}`}
            className="flex flex-1 items-stretch"
          >
            {build.image && (
              <img
                src={build.image}
                alt={build.title}
                className="w-24 object-cover rounded-l-lg"
              />
            )}
            <div className="p-4">
              <h3 className="font-medium text-white">{build.title}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {formatDistanceToNow(new Date(build.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 p-4">
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
            <DeleteBuildButton id={build.id} onDeleted={fetchBuilds} />
          </div>
        </div>
      ))}
    </div>
  );
}
