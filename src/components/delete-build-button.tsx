'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteBuildButtonProps {
  id: string
  onDeleted?: () => void
}

export default function DeleteBuildButton({ id, onDeleted }: DeleteBuildButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this build?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/builds/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete build')
      if (onDeleted) {
        onDeleted()
      } else {
        router.push('/')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
