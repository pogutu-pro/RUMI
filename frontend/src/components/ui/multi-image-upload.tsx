'use client';

import * as React from 'react';
import { UploadCloud, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  arrayMove,
} from 'react-sortable-hoc';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type UploadedFile = File & { preview: string; id: string };

interface MultiImageUploadProps {
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

const DragHandle = SortableHandle(() => (
  <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground hover:text-foreground transition-colors" />
));

const SortableItem = SortableElement(
  ({
    file,
    onRemove,
  }: {
    file: UploadedFile;
    onRemove: (id: string) => void;
  }) => (
    <li className="relative flex items-center bg-card border rounded-lg shadow-sm h-20 p-2 group">
      {/* Drag Handle */}
      <div className="h-full px-2 flex items-center border-r mr-3">
        <DragHandle />
      </div>

      {/* Image Preview */}
      <div className="relative h-full w-16 rounded-md overflow-hidden mr-4 shrink-0">
        <Image
          src={file.preview}
          alt={file.name}
          fill
          sizes="100px"
          className="object-cover"
        />
      </div>

      {/* File Details */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(file.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  ),
);

const SortableList = SortableContainer(
  ({
    files,
    onRemove,
  }: {
    files: UploadedFile[];
    onRemove: (id: string) => void;
  }) => {
    return (
      <ul className="space-y-3">
        {files.map((file, index) => (
          <SortableItem
            key={file.id}
            index={index}
            file={file}
            onRemove={onRemove}
          />
        ))}
      </ul>
    );
  },
);

/**
 * Component for uploading, previewing, and reordering multiple images.
 */
export function MultiImageUpload({
  files,
  setFiles,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // Default 5MB
}: MultiImageUploadProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Check if new files exceed maxFiles limit
      const totalFiles = files.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        toast.error('Upload Limit Exceeded', {
          description: `You can only upload a maximum of ${maxFiles} images. Please remove some existing files.`,
        });
        acceptedFiles = acceptedFiles.slice(0, maxFiles - files.length); // Only take valid number
      }

      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        ...file,
        id: Math.random().toString(36).substring(2, 9), // Unique ID for sorting
        preview: URL.createObjectURL(file),
      }));

      setFiles([...files, ...newFiles]);

      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          toast.error(`File rejected: ${rejection.file.name}`, {
            description: error.message,
          });
        });
      });
    },
    [files, maxFiles, setFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
    maxSize: maxSize,
    multiple: true,
  });

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    setFiles(arrayMove(files, oldIndex, newIndex));
  };

  const handleRemove = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
    // Revoke the object URL to free up memory
    const fileToRemove = files.find((file) => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  React.useEffect(() => {
    // Cleanup URLs when component unmounts
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'p-8 border-2 border-dashed rounded-xl text-center transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-primary mb-3" />
        <p className="text-base font-semibold text-foreground">
          Drag & drop your photos here
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse. Max {maxFiles} images (5MB per file).
        </p>
        {files.length > 0 && (
          <p className="mt-2 text-xs font-medium text-primary">
            {files.length} / {maxFiles} uploaded
          </p>
        )}
      </div>

      {/* File List / Sortable Preview */}
      {files.length > 0 && (
        <div className="border rounded-xl p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span>Manage Photos (Drag to Reorder)</span>
          </h3>
          <SortableList
            files={files}
            onRemove={handleRemove}
            onSortEnd={onSortEnd}
            useDragHandle
            lockAxis="y" // Ensure items only move vertically
          />
        </div>
      )}
    </div>
  );
}
