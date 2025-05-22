import BuildClient from '@/components/build-client';
import DeleteBuildButton from '@/components/delete-build-button';
import { Button } from '@/components/ui/button';
import { getBuild } from '@/lib/supabase';
import { ChevronLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface BuildPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BuildPageProps): Promise<Metadata> {
  const { id } = await params;
  const build = await getBuild(id);
  return {
    title: `Build Game - ${build.title}`,
    description: 'Build and test your game in real-time',
  };
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { id } = await params;
  const build = await getBuild(id);

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* Header */}
      <header className="flex items-center p-3 border-b border-[#30363d]">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#c9d1d9] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        {build.image && (
          <img
            src={build.image}
            alt={build.title}
            className="w-8 h-8 object-cover rounded-md ml-2"
          />
        )}
        <div className="ml-2">
          <h1 className="text-sm font-medium">{build.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            className="bg-white cursor-pointer"
            variant="secondary"
            size="lg"
          >
            Publish
          </Button>
          <DeleteBuildButton id={id} />
        </div>
      </header>

      <BuildClient buildId={id} threadId={build.thread_id} />
    </div>
  );
}
