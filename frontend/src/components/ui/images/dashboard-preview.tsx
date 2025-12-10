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
        'group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 border border-gray-100',
        className,
      )}
    >
      {/* The actual dashboard screenshot - larger and more prominent */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top transition-all duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={100}
          priority
        />
        {/* Modern gradient overlay with glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />
        
        {/* Animated shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>

      {/* Text below with better spacing */}
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">{title}</h3>
        <p className="text-base text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Premium "Live Preview" badge with glassmorphism */}
      <div className="absolute top-6 right-6 opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100">
        <span className="rounded-full bg-green-600/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white shadow-2xl border border-white/20">
          Live Preview
        </span>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
