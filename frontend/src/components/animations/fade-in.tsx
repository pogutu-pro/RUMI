import type { UseInViewOptions } from 'framer-motion';

/*
 * These used to start content invisible and fade it in once scrolled into
 * view. That left blank bands for slow phones, screenshots and crawlers that
 * do not scroll (search engines and AI assistants read the server HTML).
 * They now render content immediately; the props are kept so existing pages
 * keep compiling.
 */

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  fullWidth?: boolean;
  viewport?: UseInViewOptions;
}

export function FadeIn({ children, className = '', fullWidth = false }: FadeInProps) {
  return <div className={`${fullWidth ? 'w-full ' : ''}${className}`}>{children}</div>;
}

export function FadeInStagger({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
  faster?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function FadeInItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
