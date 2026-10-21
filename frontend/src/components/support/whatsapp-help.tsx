'use client';

import { SocialIcon } from '@/components/layouts/social-links';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { cn } from '@/lib/utils/cn';

/** RumiaRent support on WhatsApp (0757 901 596), in wa.me's international form. */
export const SUPPORT_WHATSAPP = '254757901596';

export type HelpTopic = 'paybill' | 'daraja' | 'bank' | 'plan';

const MESSAGES: Record<HelpTopic, string> = {
  paybill: 'Hi RumiaRent, please help me set up my M-Pesa paybill so tenant payments are matched automatically.',
  daraja: "Hi RumiaRent, please help me connect my paybill's Safaricom Daraja API keys.",
  bank: 'Hi RumiaRent, please help me set up matching for rent paid into my bank account.',
  plan: 'Hi RumiaRent, I need help choosing or paying for a plan.',
};

/** The wa.me link with the message for `topic`, plus who is asking so support can find the account. */
export function whatsappHelpUrl(topic: HelpTopic, who?: { email?: string | null; business?: string | null }): string {
  const lines = [MESSAGES[topic]];
  if (who?.business) lines.push(`Business: ${who.business}`);
  if (who?.email) lines.push(`Account: ${who.email}`);
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * "We can set it up with you" on any setup step that involves money.
 * Opens WhatsApp with the message already written; the person only taps send.
 */
export function WhatsAppHelp({
  topic,
  business,
  className,
  label = 'Get help on WhatsApp',
  variant = 'link',
}: {
  topic: HelpTopic;
  business?: string | null;
  className?: string;
  label?: string;
  variant?: 'link' | 'button';
}) {
  const email = useAuthStore((s) => s.user?.email);
  return (
    <a
      href={whatsappHelpUrl(topic, { email, business })}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 font-medium',
        variant === 'button'
          ? 'h-11 justify-center rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-4 text-sm text-[#0b7a3b] hover:bg-[#25D366]/15 dark:text-[#4ade80]'
          : 'text-sm text-[#0b7a3b] hover:underline dark:text-[#4ade80]',
        className,
      )}
    >
      <SocialIcon platform="whatsapp" className="h-4 w-4 shrink-0" />
      {label}
    </a>
  );
}
