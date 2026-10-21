'use client';

import * as React from 'react';
import { Facebook, Globe, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance as axios } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

interface PublicSocialLink {
  platform: string;
  url: string;
}

const LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

function Svg({ className, d }: { className?: string; d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

const X_PATH =
  'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
const TIKTOK_PATH =
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

/** One platform's icon; falls back to a globe for anything unknown. */
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case 'facebook': return <Facebook className={className} aria-hidden="true" />;
    case 'instagram': return <Instagram className={className} aria-hidden="true" />;
    case 'linkedin': return <Linkedin className={className} aria-hidden="true" />;
    case 'youtube': return <Youtube className={className} aria-hidden="true" />;
    case 'x': return <Svg className={className} d={X_PATH} />;
    case 'tiktok': return <Svg className={className} d={TIKTOK_PATH} />;
    case 'whatsapp': return <Svg className={className} d={WHATSAPP_PATH} />;
    default: return <Globe className={className} aria-hidden="true" />;
  }
}

/**
 * Social icons for the public site. The links come from what a super admin
 * saved under Platform > Integrations; with none saved this renders nothing,
 * so no icon ever points at a profile that does not exist.
 */
export function SocialLinks({ className, itemClassName }: { className?: string; itemClassName?: string }) {
  const { data: links = [] } = useQuery({
    queryKey: ['social-links'],
    queryFn: async (): Promise<PublicSocialLink[]> => {
      const res = await axios.get<{ results: PublicSocialLink[] }>('/home/social-links/');
      return res.data.results;
    },
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  if (links.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-3', className)} aria-label="RumiaRent on social media">
      {links.map((link) => (
        <li key={link.platform}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`RumiaRent on ${LABELS[link.platform] ?? link.platform}`}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900',
              itemClassName,
            )}
          >
            <SocialIcon platform={link.platform} className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
