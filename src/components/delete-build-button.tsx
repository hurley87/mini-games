'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeleteBuildButtonProps {
  id: string;
  onDeleted?: () => void;
}

export default function DeleteBuildButton({
  id,
  onDeleted,
}: DeleteBuildButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteBuild = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/builds/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete build');

      toast.success('Build deleted successfully');

      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to delete build');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    toast('Are you sure you want to delete this build?', {
      action: {
        label: 'Delete',
        onClick: () => deleteBuild(),
      },
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 cursor-pointer"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
