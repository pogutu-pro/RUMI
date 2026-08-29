import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shell } from '@/components/layouts/shell';
import { Icon } from '@/components/ui/icons';

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/help-center', label: 'Help Center' },
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact' },
      { href: '/guides', label: 'Guides' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/compliance', label: 'Compliance' },
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
    <footer className="w-full bg-gray-950 border-t border-gray-800">
      {/* Main footer container with proper horizontal padding */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32">
        <div className="py-20 md:py-24">
          <div className="grid grid-cols-1 gap-16 lg:gap-20 lg:grid-cols-12">
            {/* Brand Section - More width and breathing room */}
            <div className="space-y-8 lg:col-span-5">
              <Link
                href="/"
                className="inline-flex items-center space-x-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-xl transition-all hover:opacity-90"
              >
                <Image
                  src="/images/logo/logo.svg"
                  alt="RumiaRent Logo"
                  width={56}
                  height={56}
                  className="h-14 w-auto"
                />
                <span className="font-extrabold text-4xl text-white tracking-tight">RumiaRent</span>
              </Link>
              <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                Rental management for Kenyan landlords and agents. Properties, tenants, rent, and payments in one place.
              </p>
              
              {/* Social Media */}
              <div className="pt-6">
                <p className="text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">Connect With Us</p>
                <div className="flex items-center space-x-5">
                  <a
                    href="https://twitter.com/rumia"
                    aria-label="RumiaRent on Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    <Icon
                      name="Twitter"
                      className="h-6 w-6"
                    />
                  </a>
                  <a
                    href="https://instagram.com/rumia"
                    aria-label="RumiaRent on Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    <Icon
                      name="Instagram"
                      className="h-6 w-6"
                    />
                  </a>
                  <a
                    href="https://facebook.com/rumia"
                    aria-label="RumiaRent on Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    <Icon
                      name="Facebook"
                      className="h-6 w-6"
                    />
                  </a>
                  <a
                    href="https://linkedin.com/company/rumia"
                    aria-label="RumiaRent on LinkedIn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    <Icon
                      name="Linkedin"
                      className="h-6 w-6"
                    />
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation Links - Clean 2x2 grid with proper spacing */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
                {FOOTER_LINKS.map((section) => (
                  <div key={section.title} className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                      {section.title}
                    </h4>
                    <ul className="space-y-4">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href as any}
                            className="text-base text-gray-400 hover:text-white transition-colors duration-300 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-md hover:translate-x-1 transform py-1"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Clear separation and proper alignment */}
        <div className="py-12 border-t border-gray-800">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center space-y-3 md:items-start">
              <p className="text-base text-gray-400">
                &copy; {currentYear} RumiaRent. All rights reserved.
              </p>
              <p className="text-sm text-gray-500">
                Built with ❤️ for students everywhere.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <Link
                href="/privacy"
                className="text-base text-gray-400 hover:text-white transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-md py-2"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-base text-gray-400 hover:text-white transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-md py-2"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-base text-gray-400 hover:text-white transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-md py-2"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
