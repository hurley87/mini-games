'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Creator {
  fid: number;
  username: string;
  pfp: string;
  bio: string;
  primary_address: string;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  score: number;
}

interface Coin {
  name: string;
  image: string;
  symbol: string;
  coin_address: string;
  build_id: string;
  fid: number;
  updated_at: string;
  wallet_address: string;
  wallet_id: string;
  chain_type: string;
  pool_initialized?: boolean;
}

interface Build {
  id: string;
  title: string;
  html: string;
  fid: number;
  created_at: string;
  status?: string;
  image?: string;
  coins?: Coin[];
}

interface ProfileData {
  creator: Creator;
  builds: Build[];
  stats: {
    totalBuilds: number;
    publishedBuilds: number;
    tokenizedBuilds: number;
  };
}

interface ProfileContentProps {
  address: string;
}

export default function ProfileContent({ address }: ProfileContentProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/creators/${address}`);
        
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [address]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profileData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || 'The profile you are looking for does not exist.'}
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { creator, builds, stats } = profileData;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-[#2a2a2a] rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6 mb-8">
          <img
            src={creator.pfp || '/placeholder-avatar.png'}
            alt={creator.username}
            className="w-24 h-24 rounded-full border-2 border-gray-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{creator.username}</h1>
              {creator.power_badge && (
                <Badge variant="secondary" className="bg-purple-600 text-white">
                  Power Badge
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mb-2">{formatAddress(creator.primary_address)}</p>
            {creator.bio && (
              <p className="text-gray-300 leading-relaxed">{creator.bio}</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#3a3a3a] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalBuilds}</div>
            <div className="text-sm text-gray-400">Total Games</div>
          </div>
          <div className="bg-[#3a3a3a] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.publishedBuilds}</div>
            <div className="text-sm text-gray-400">Published</div>
          </div>
          <div className="bg-[#3a3a3a] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.tokenizedBuilds}</div>
            <div className="text-sm text-gray-400">Tokenized</div>
          </div>
          <div className="bg-[#3a3a3a] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{creator.follower_count}</div>
            <div className="text-sm text-gray-400">Followers</div>
          </div>
          <div className="bg-[#3a3a3a] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{creator.score}</div>
            <div className="text-sm text-gray-400">Score</div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="bg-[#2a2a2a] rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Games</h2>
        {builds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No games created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((build) => (
              <div key={build.id} className="bg-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#4a4a4a] transition-colors">
                {build.image && (
                  <img
                    src={build.image}
                    alt={build.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white truncate flex-1">{build.title}</h3>
                    <div className="flex gap-1 ml-2">
                      {build.status === 'completed' && build.html && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Live
                        </Badge>
                      )}
                      {build.coins && build.coins.length > 0 && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          Token
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Created {formatDate(build.created_at)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/build/${build.id}`, '_blank')}
                  >
                    View Game
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-[#2a2a2a] rounded-lg p-8 animate-pulse">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
        </div>
      </div>
    </div>
  );
}