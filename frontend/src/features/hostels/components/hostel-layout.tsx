'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HostelLayoutProps {
  children: React.ReactNode;
  hero: React.ReactNode;
  gallery: React.ReactNode;
  sidebar?: React.ReactNode;
  stickyCta?: React.ReactNode;
  className?: string;
}

/**
 * HostelLayout - Premium layout shell for hostel details
 * Features: Sticky glassmorphism headers, staggered entry animations, and responsive sidebars
 */
export default function HostelLayout({
  children,
  hero,
  gallery,
  sidebar,
  stickyCta,
  className,
}: HostelLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-white selection:bg-emerald-100', className)}>
      {/* Hero Section - High impact entrance */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {hero}
      </div>

      {/* Gallery Section - Full width experience on mobile, constrained on desktop */}
      <section className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50">
          {gallery}
        </div>
      </section>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {children}
            </motion.div>
          </div>

          {/* Sidebar Column - Sticky on scroll */}
          {sidebar && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {sidebar}
                </motion.div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Floating Sticky CTA for Mobile/Tablet */}
      <AnimatePresence>
        {stickyCta && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:hidden bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
          >
            {stickyCta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
