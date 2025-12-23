'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedHostelImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onFilesChange?: (files: File[]) => void;
  onCategoriesChange?: (categories: Record<number, string>) => void;
  initialImages?: string[];
  initialCategories?: Record<number, string>;
  showValidation?: boolean;
}

type PhotoCategory = 'exterior' | 'room' | 'bathroom' | 'common';

const CATEGORIES = [
  { id: 'exterior' as PhotoCategory, label: 'Exterior', icon: '🏠', description: 'Front gate, building' },
  { id: 'room' as PhotoCategory, label: 'Room', icon: '🛏️', description: 'Empty room interiors' },
  { id: 'bathroom' as PhotoCategory, label: 'Bathroom', icon: '🚿', description: 'Clean bathrooms' },
  { id: 'common' as PhotoCategory, label: 'Common', icon: '🍳', description: 'Kitchen/lounge' },
];

export default function EnhancedHostelImageUpload({
  onImagesChange,
  onFilesChange,
  onCategoriesChange,
  initialImages = [],
  initialCategories = {},
  showValidation = true,
}: EnhancedHostelImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Record<number, string>>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('exterior');
  const [isDragging, setIsDragging] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MIN_IMAGES = 5;
  const MAX_IMAGES = 8;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const processFiles = useCallback((newFiles: File[]) => {
    if (images.length + newFiles.length > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} photos`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    let hasErrors = false;

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        hasErrors = true;
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 5MB`);
        hasErrors = true;
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Assign categories to new images
    const newCategories = { ...categories };
    const startIndex = images.length;
    validFiles.forEach((_, idx) => {
      newCategories[startIndex + idx] = selectedCategory;
    });
    
    // Update state
    const updatedImages = [...images, ...newUrls];
    const updatedFiles = [...files, ...validFiles];
    const newTotalSize = updatedFiles.reduce((sum, f) => sum + f.size, 0);
    
    setImages(updatedImages);
    setFiles(updatedFiles);
    setCategories(newCategories);
    setTotalSize(newTotalSize);
    
    // Notify parent
    onImagesChange(updatedImages);
    if (onFilesChange) onFilesChange(updatedFiles);
    if (onCategoriesChange) onCategoriesChange(newCategories);
    
    toast.success(`${validFiles.length} photo(s) added`);

    // Auto-submit at exactly 8 photos
    if (updatedImages.length === MAX_IMAGES) {
      toast.info('Maximum photos reached! Ready to publish.');
    }
  }, [images, files, categories, selectedCategory, onImagesChange, onFilesChange, onCategoriesChange]);

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
    const updatedFiles = files.filter((_, i) => i !== index);
    
    // Re-index categories
    const newCategories: Record<number, string> = {};
    Object.keys(categories).forEach(key => {
      const idx = parseInt(key);
      if (idx < index) {
        newCategories[idx] = categories[idx];
      } else if (idx > index) {
        newCategories[idx - 1] = categories[idx];
      }
    });
    
    const newTotalSize = updatedFiles.reduce((sum, f) => sum + f.size, 0);
    
    setImages(updatedImages);
    setFiles(updatedFiles);
    setCategories(newCategories);
    setTotalSize(newTotalSize);
    
    onImagesChange(updatedImages);
    if (onFilesChange) onFilesChange(updatedFiles);
    if (onCategoriesChange) onCategoriesChange(newCategories);
  };

  const triggerUpload = () => inputRef.current?.click();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const isMinimumMet = images.length >= MIN_IMAGES;
  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="space-y-6">
      {/* Photo Requirements Guide */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
          ✅ REQUIRED (Minimum 5 photos)
        </h3>
        <ul className="space-y-2 text-base text-blue-800 dark:text-blue-200">
          <li>• <strong>1-2 Exterior shots</strong> (front gate, building)</li>
          <li>• <strong>3-5 Empty room interiors</strong> (different types)</li>
          <li>• <strong>1-2 Clean bathrooms</strong></li>
          <li>• <strong>1 Optional common area</strong> (kitchen/lounge)</li>
        </ul>
        <p className="mt-4 text-base font-medium text-blue-900 dark:text-blue-100">
          📱 <strong>Tips:</strong> Take photos in daylight, rooms empty, bathrooms spotless
        </p>
      </div>

      {/* Photo Counter */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-bold text-foreground">
            Photos Uploaded: {images.length}/{MAX_IMAGES}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Total size: {formatFileSize(totalSize)}
          </p>
        </div>
        {showValidation && (
          <div>
            {isMinimumMet ? (
              <Badge className="bg-green-600 text-white px-4 py-2 text-base">
                <Check className="h-4 w-4 mr-1" />
                Minimum met!
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 px-4 py-2 text-base">
                <AlertCircle className="h-4 w-4 mr-1" />
                Add {MIN_IMAGES - images.length} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Category Chips - Large touch targets */}
      {canAddMore && (
        <div>
          <Label className="text-base font-bold text-foreground mb-3 block">
            Select Photo Category Before Upload:
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all cursor-pointer",
                  "hover:bg-muted/50 min-h-[100px]",
                  selectedCategory === cat.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-muted"
                )}
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="text-base font-bold text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {cat.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Large Dropzone */}
      {canAddMore && (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-8 md:p-12",
            "hover:border-primary hover:bg-primary/5",
            isDragging 
              ? "border-primary bg-primary/10 scale-[0.98]" 
              : "border-muted-foreground/30"
          )}
          onClick={triggerUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ minHeight: '300px' }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Drag photos here or click to browse
            </h3>
            <p className="text-base text-muted-foreground mb-4">
              Max 8 photos • JPG/PNG • Less than 5MB each
            </p>
            <div className="flex gap-3">
              <Button type="button" size="lg" className="gap-2">
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              <Button type="button" variant="outline" size="lg" className="gap-2">
                <Upload className="h-5 w-5" />
                Choose Files
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Grid */}
      {images.length > 0 && (
        <div>
          <Label className="text-base font-bold text-foreground mb-3 block">
            Your Photos (Drag 🔀 to reorder)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {images.map((url, i) => {
                const category = categories[i];
                const categoryData = CATEGORIES.find(c => c.id === category);
                
                return (
                  <motion.div
                    key={`${url}-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative aspect-4/3 rounded-lg overflow-hidden shadow-sm border-2 border-muted bg-muted"
                  >
                    <Image
                      src={url}
                      alt={`Hostel photo ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Category Badge */}
                    {categoryData && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/70 text-white border-0 text-sm">
                          {categoryData.icon} {categoryData.label}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      onClick={() => removeImage(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center bg-muted/20">
          <div className="p-4 rounded-full bg-muted mb-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground">No photos uploaded yet</p>
          <p className="text-base text-muted-foreground mt-2">
            Select a category above and upload your first photo
          </p>
        </div>
      )}

      {/* Validation Message */}
      {showValidation && !isMinimumMet && images.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div>
            <p className="text-base font-bold text-orange-900 dark:text-orange-100">
              Add {MIN_IMAGES - images.length} more photo{MIN_IMAGES - images.length === 1 ? '' : 's'} to publish
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Students book faster when they can see quality photos of your hostel
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showValidation && isMinimumMet && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <p className="text-base font-bold text-green-900 dark:text-green-100">
              ✅ Ready to go live!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              You've uploaded {images.length} photo{images.length === 1 ? '' : 's'}. You can add more or publish now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
