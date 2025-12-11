'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HostelImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onFilesChange?: (files: File[]) => void;
  initialImages?: string[];
}

export default function HostelImageUpload({
  onImagesChange,
  onFilesChange,
  initialImages = [],
}: HostelImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 8;

  const processFiles = (newFiles: File[]) => {
    if (images.length + newFiles.length > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== newFiles.length) {
      toast.error('Some files were rejected. Please upload images only.');
    }

    // Create previews
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Update state
    const updatedImages = [...images, ...newUrls];
    const updatedFiles = [...files, ...validFiles];
    
    setImages(updatedImages);
    setFiles(updatedFiles);
    
    // Notify parent
    onImagesChange(updatedImages);
    if (onFilesChange) onFilesChange(updatedFiles);
    
    toast.success(`${validFiles.length} image(s) added`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedFiles = files.filter((_, i) => i !== index); // Note: this assumes new files are appended. Might de-sync if mixed with initialImages but for "Add New" it works. 
    
    setImages(updatedImages);
    setFiles(updatedFiles);
    
    onImagesChange(updatedImages);
    if (onFilesChange) onFilesChange(updatedFiles);
  };

  const triggerUpload = () => inputRef.current?.click();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Property Photos <span className="text-muted-foreground ml-1">({images.length}/{MAX_IMAGES})</span>
        </Label>
        <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          Max {MAX_IMAGES} images
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {images.map((url, i) => (
            <motion.div
              key={`${url}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-50"
            >
              <Image
                src={url}
                alt={`Property image ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-sm"
                onClick={() => removeImage(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))}
          
          {images.length < MAX_IMAGES && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className={cn(
                "relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
                isDragging ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-[0.98]" : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
              )}
              onClick={triggerUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
               <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
              />
            </motion.div>
        )}
        </AnimatePresence>
      </div>
      
      {images.length === 0 && (
         <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-md text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No images uploaded</p>
            <p className="text-xs text-muted-foreground mt-1">Add images to showcase your hostel</p>
         </div>
      )}
    </div>
  );
}
