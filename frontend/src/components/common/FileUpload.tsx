import React, { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: string | null;
  placeholder?: string;
  className?: string;
  type?: 'image' | 'document' | 'both';
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = "image/*",
  maxSize = 5,
  currentFile = null,
  placeholder = "Click to upload or drag and drop",
  className = "",
  type = 'image',
  multiple = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFile);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return false;
    }

    if (type === 'document' && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please select a PDF, JPG, or PNG file');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove?.();
  };

  const getFileIcon = () => {
    if (preview && type === 'image') {
      return null; // Show preview image instead
    }
    return type === 'document' ? DocumentIcon : PhotoIcon;
  };

  const getAcceptTypes = () => {
    switch (type) {
      case 'image':
        return 'image/*';
      case 'document':
        return '.pdf,.jpg,.jpeg,.png';
      case 'both':
        return 'image/*,.pdf,.jpg,.jpeg,.png';
      default:
        return accept;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${preview ? 'border-solid' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptTypes()}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            {type === 'image' ? (
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <DocumentIcon className="w-16 h-16 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Document uploaded</p>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {getFileIcon() && (
              <div className="mx-auto w-16 h-16 text-gray-400">
                {React.createElement(getFileIcon()!, { className: "w-full h-full" })}
              </div>
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {type === 'image' ? 'Upload Image' : type === 'document' ? 'Upload Document' : 'Upload File'}
              </p>
              <p className="text-sm text-gray-500">
                {placeholder}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: {maxSize}MB • {type === 'image' ? 'JPG, PNG, GIF' : type === 'document' ? 'PDF, JPG, PNG' : 'All formats'}
              </p>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              <CloudArrowUpIcon className="w-4 h-4 mr-2" />
              Choose File
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <XMarkIcon className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;