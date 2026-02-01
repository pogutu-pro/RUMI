'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DashboardPreviewProps {
  src: string;
  alt: string;
  title: string;
  description: string;
  className?: string;
}

export default function DashboardPreview({
  src,
  alt,
  title,
  description,
  className,
}: DashboardPreviewProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-none bg-card shadow-none border-2 border-border',
        className,
      )}
    >
      {/* The actual dashboard screenshot - larger and more prominent */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={100}
          priority
        />
      </div>

      {/* Text below with better spacing */}
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">{title}</h3>
        <p className="text-base text-gray-600 leading-relaxed">{description}</p>
      </div>

      <div className="absolute top-6 right-6">
        <span className="bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground border-2 border-primary">
          Live Preview
        </span>
      </div>
    </div>
  );
}
