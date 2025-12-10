import { useQueryClient } from '@tanstack/react-query';

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (queryKey: unknown[]) => queryClient.invalidateQueries({ queryKey });
}
