import { queryClient } from './query-client';
import { QueryKey } from '@tanstack/react-query';

/**
 * Prefetch a query and add it to the cache
 * Useful for optimizing initial page loads and navigation
 */
export async function prefetchQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime,
  });
}

/**
 * Prefetch multiple queries in parallel
 */
export async function prefetchQueries(
  queries: Array<{
    queryKey: QueryKey;
    queryFn: () => Promise<unknown>;
    staleTime?: number;
  }>
): Promise<void> {
  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery({
        queryKey: query.queryKey,
        queryFn: query.queryFn,
        staleTime: query.staleTime,
      })
    )
  );
}

/**
 * Prefetch data for server-side rendering
 * Used in Next.js page/layout components
 */
export async function prefetchServerData<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>
): Promise<TData> {
  return queryClient.fetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Invalidate and refetch a query
 */
export async function invalidateQuery(queryKey: QueryKey): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
}

/**
 * Clear all cached queries
 */
export function clearCache(): void {
  queryClient.clear();
}
