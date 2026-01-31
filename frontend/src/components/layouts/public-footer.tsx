import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shell } from '@/components/layouts/shell';
import { Icon } from '@/components/ui/icons';

const FOOTER_LINKS = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/features', label: 'Features' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/contact', label: 'Help Center' },
      { href: '/faq', label: 'FAQ' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
  {
    title: 'Hosting',
    links: [
      { href: '/how-it-works/landlords', label: 'List Your Hostel' },
      { href: '/payments/payouts', label: 'Payouts' },
      { href: '/admin/dashboard', label: 'Admin Portal' },
    ],
  },
];

/**
 * Public footer component with company information, navigation links, and social media.
 * Displays copyright information with current year.
 * Charcoal black background for professional appearance across all public pages.
 */
export const Footer = React.memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-900">
      <Shell className="pt-16 pb-8 md:pt-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Logo and Social - Takes more space on desktop */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
            >
              <Image
                src="/images/logo/logo.svg"
                alt="RUMI Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="font-extrabold text-2xl text-white">RUMI</span>
            </Link>
            <p className="text-base text-gray-400 max-w-sm leading-relaxed">
              The Living Campus Standard: Safe, modern, and smart student
              accommodation booking.
            </p>
            
            {/* Social Media */}
            <div className="flex items-center space-x-5 pt-2">
              <a
                href="https://twitter.com/rumi"
                aria-label="RUMI on Twitter"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Icon
                  name="Twitter"
                  className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
                />
              </a>
              <a
                href="https://instagram.com/rumi"
                aria-label="RUMI on Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Icon
                  name="Instagram"
                  className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
                />
              </a>
              <a
                href="https://facebook.com/rumi"
                aria-label="RUMI on Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Icon
                  name="Facebook"
                  className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
                />
              </a>
            </div>
          </div>

          {/* Navigation Links - Better distributed on desktop */}
          {FOOTER_LINKS.map((section) => (
            <div key={section.title} className="space-y-4 lg:col-span-2 lg:col-start-auto">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as any}
                      className="text-sm text-gray-400 hover:text-primary transition-colors inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section - Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} RUMI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    </footer>
  );
});
