'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditableTitleProps {
  buildId: string;
  initialTitle: string;
  className?: string;
}

export default function EditableTitle({
  buildId,
  initialTitle,
  className = '',
}: EditableTitleProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalTitle, setOriginalTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setOriginalTitle(title);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (title.trim() === '' || title === originalTitle) {
      handleCancel();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/builds/${buildId}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update title');
      }

      setTitle(data.data.title);
      setIsEditing(false);
      router.refresh(); // Refresh the page to update metadata
    } catch (error) {
      console.error('Error updating title:', error);
      // Revert to original title on error
      setTitle(originalTitle);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle(originalTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow clicking on save/cancel buttons
    setTimeout(() => {
      if (isEditing && !isLoading) {
        handleSave();
      }
    }, 150);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isLoading}
          className={`bg-[#30363d] border border-[#444c56] rounded px-2 py-1 text-sm font-medium text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0 ${className}`}
          maxLength={100}
        />
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-[#7d8590]" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 cursor-pointer hover:bg-[#30363d]/50 rounded px-1 py-1 transition-colors ${className}`}
      onClick={handleStartEdit}
    >
      <h1 className="text-sm font-medium text-[#c9d1d9] select-none">
        {title}
      </h1>
      <Pencil className="h-3 w-3 text-[#7d8590] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
