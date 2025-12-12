
import { Suspense } from 'react';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Loading from './loading';
import { getHostelBySlug, getRelatedHostels } from '@/features/hostels';
import type { Metadata } from 'next';
import { HostelDetailClient } from '@/features/hostels';

interface HostelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: HostelPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const hostel = await getHostelBySlug(slug);
    return {
      title: `${hostel.name} | Rumi Hostels`,
      description: hostel.description.slice(0, 160),
      openGraph: {
        title: hostel.name,
        description: hostel.description.slice(0, 160),
        images: hostel.images.length > 0 ? [hostel.images[0]] : [],
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Hostel Not Found | Rumi Hostels',
      description: 'The hostel you are looking for could not be found.',
    };
  }
}

async function HostelPageContent({ slug }: { slug: string }) {
  const queryClient = new QueryClient();

  try {
    // Prefetch data on the server for better performance
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['hostel', slug],
        queryFn: () => getHostelBySlug(slug),
      }),
      queryClient.prefetchQuery({
        queryKey: ['relatedHostels', slug],
        queryFn: () => getRelatedHostels(slug),
      }),
    ]);
  } catch (error) {
    // Error will be handled by error.tsx
    console.error('Failed to prefetch hostel data:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HostelDetailClient slug={slug} />
    </HydrationBoundary>
  );
}

export default async function HostelPage({ params }: HostelPageProps) {
  const { slug } = await params;
  
  return (
    <Suspense fallback={<Loading />}>
      <HostelPageContent slug={slug} />
    </Suspense>
  );
}
