import { Suspense } from 'react';
import ProfileContent from '@/components/profile-content';
import Header from '@/components/header';

interface ProfilePageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <main className="pt-16">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent address={address} />
        </Suspense>
      </main>
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
          <div className="bg-gray-700 rounded p-4 h-20"></div>
        </div>
      </div>
    </div>
  );
}