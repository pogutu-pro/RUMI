import { ReactNode } from 'react';
import { HostelsHeader } from '@/components/layouts/hostels-header';
import { Footer } from '@/components/layouts/public-footer';

interface HostelsLayoutProps {
  children: ReactNode;
}

/**
 * Layout specifically for the hostels page and its sub-pages
 * Uses the unique HostelsHeader component with advanced search
 */
export default function HostelsLayout({ children }: HostelsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <HostelsHeader />
      <main className="flex-1">{children}</main>
    
    </div>
  );
}
