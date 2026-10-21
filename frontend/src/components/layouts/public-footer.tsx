import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SocialLinks } from '@/components/layouts/social-links';
import { TAGLINE } from '@/lib/marketing';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/for/landlords', label: 'For landlords' },
      { href: '/for/agents', label: 'For agents' },
      { href: '/guides', label: 'Guides' },
      { href: '/rentals', label: 'Find a rental' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Help and legal',
    links: [
      { href: '/faq', label: 'Help and FAQ' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/compliance', label: 'Compliance' },
    ],
  },
];

export const Footer = React.memo(function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/images/logo/logo.png" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight text-gray-900">
                Rumia<span className="text-primary">Rent</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">{TAGLINE}.</p>
            <p className="mt-3 text-sm text-gray-600">
              <a href="mailto:info@rumiarent.com" className="hover:text-gray-900">info@rumiarent.com</a>
            </p>
            <div className="mt-4">
              <SocialLinks />
            </div>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-gray-900">{column.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} RumiaRent. All rights reserved.</p>
          <p>
            Built and managed by{' '}
            <a href="https://www.stratnovo.co.ke/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-700">
              Stratnovo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
});
