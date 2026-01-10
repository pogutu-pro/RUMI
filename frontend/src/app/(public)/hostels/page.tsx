import { Suspense } from 'react';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Loading from './loading';
import { getHostels } from '@/features/hostels';
import { HostelsView } from '@/features/hostels';

async function HostelsPageContent() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ['hostels'],
      queryFn: getHostels,
      staleTime: 5 * 60 * 1000,
    });
  } catch (error) {
    console.error('Failed to prefetch hostels:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HostelsView />
    </HydrationBoundary>
  );
}

export default function HostelsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HostelsPageContent />
    </Suspense>
  );
}
