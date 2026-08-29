'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/react-query/query-client';
import { AuthProvider } from '@/providers/auth-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { TokenRefresher } from '@/features/auth';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TokenRefresher />
        {children}
      </AuthProvider>
      <ToastProvider />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
