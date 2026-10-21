import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides and updates on renting, collecting rent and managing properties in Kenya, from the RumiaRent team.',
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
