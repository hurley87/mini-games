'use client';

import { Badge } from '@/components/ui/badge';
import DeleteBuildButton from '@/components/delete-build-button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect } from 'react';
import { useBuilds } from '@/lib/build-context';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  Code,
} from 'lucide-react';

const getStatusInfo = (status?: string) => {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        label: 'Queued',
        color: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
        iconColor: 'text-yellow-400',
      };
    case 'generating_content':
      return {
        icon: Code,
        label: 'Generating',
        color: 'bg-blue-900/30 text-blue-400 border-blue-800',
        iconColor: 'text-blue-400',
      };
    case 'generating_image':
      return {
        icon: Image,
        label: 'Creating Image',
        color: 'bg-purple-900/30 text-purple-400 border-purple-800',
        iconColor: 'text-purple-400',
      };
    case 'completed':
      return {
        icon: CheckCircle,
        label: 'Ready',
        color: 'bg-green-900/30 text-green-400 border-green-800',
        iconColor: 'text-green-400',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: 'Failed',
        color: 'bg-red-900/30 text-red-400 border-red-800',
        iconColor: 'text-red-400',
      };
    default:
      return {
        icon: CheckCircle,
        label: 'Ready',
        color: 'bg-green-900/30 text-green-400 border-green-800',
        iconColor: 'text-green-400',
      };
  }
};

export default function BuildList() {
  const { builds, isLoading, error, refreshBuilds, updateProcessingBuilds } =
    useBuilds();

  useEffect(() => {
    const processingBuilds = builds.filter(
      (build) => build.status && !['completed', 'failed'].includes(build.status)
    );

    if (processingBuilds.length === 0) return;

    const processingBuildIds = processingBuilds.map((build) => build.id);

    const interval = setInterval(() => {
      updateProcessingBuilds(processingBuildIds);
    }, 2000);

    return () => clearInterval(interval);
  }, [builds, updateProcessingBuilds]);

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

  if (builds.length === 0) {
    return (
      <div className="text-center py-16 bg-[#2a2a2a] rounded-lg border border-gray-700">
        <div className="max-w-md mx-auto px-6">
          <p className="text-gray-300 mb-8 leading-relaxed">
            Before creating your first game, we recommend checking out our{' '}
            <Link
              href="/docs"
              className="text-blue-400 hover:text-blue-300 underline font-semibold"
            >
              documentation
            </Link>{' '}
            to understand best practices and get inspired by examples.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full pb-10">
      {builds.map((build) => {
        const statusInfo = getStatusInfo(build.status);
        const StatusIcon = statusInfo.icon;
        const isProcessing =
          build.status && !['completed', 'failed'].includes(build.status);

        return (
          <div
            key={build.id}
            className="flex items-stretch justify-between group w-full bg-[#2a2a2a] rounded-lg overflow-hidden hover:bg-[#333333] transition-colors"
          >
            <Link
              href={`/build/${build.id}`}
              className="flex flex-1 items-stretch"
            >
              {build.image ? (
                <img
                  src={build.image}
                  alt={build.title}
                  className="w-24 object-cover rounded-l-lg"
                />
              ) : (
                <div className="w-24 bg-gray-700 flex items-center justify-center rounded-l-lg">
                  {isProcessing && (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  )}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-white">{build.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(build.created_at), {
                    addSuffix: true,
                  })}
                </p>
                {build.status === 'failed' && build.error_message && (
                  <p className="text-sm text-red-400 mt-1">
                    {build.error_message}
                  </p>
                )}
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
                className={`flex items-center gap-1 ${statusInfo.color}`}
              >
                <StatusIcon
                  className={`w-3 h-3 ${statusInfo.iconColor} ${
                    isProcessing ? 'animate-pulse' : ''
                  }`}
                />
                {statusInfo.label}
              </Badge>

              {build.isPublished && build.status === 'completed' && (
                <Badge
                  variant="outline"
                  className="bg-green-900/30 text-green-400 border-green-800 flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Live
                </Badge>
              )}
              <DeleteBuildButton id={build.id} onDeleted={refreshBuilds} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
