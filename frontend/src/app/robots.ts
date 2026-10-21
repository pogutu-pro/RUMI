import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  // AI search and answer engines each check their own user agent, so name
  // them explicitly. Private app areas stay disallowed for everyone.
  const AI_SEARCH_BOTS = [
    'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'Claude-SearchBot', 'Claude-User', 'ClaudeBot',
    'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Bingbot', 'Applebot', 'Applebot-Extended',
  ];
  const PRIVATE = [
    '/api/', '/landlord/', '/tenant/', '/caretaker/', '/platform/', '/tech-support/', '/onboarding', '/login',
    '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-phone', '/offline',
  ];
  return {
    rules: [
      { userAgent: AI_SEARCH_BOTS, allow: ['/', '/llms.txt', '/llms-full.txt'], disallow: PRIVATE },
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/api/',
          '/landlord/',
          '/tenant/',
          '/caretaker/',
          '/platform/',
          '/tech-support/',
          '/onboarding',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/verify-phone',
          '/offline',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
