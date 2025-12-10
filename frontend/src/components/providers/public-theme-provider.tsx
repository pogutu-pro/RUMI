'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false} 
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
