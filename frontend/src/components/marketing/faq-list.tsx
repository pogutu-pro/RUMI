import { ChevronDown } from 'lucide-react';

/**
 * Questions as plain <details>: every answer is in the HTML (crawlers and AI
 * assistants read it), it works without JavaScript, and it is keyboard friendly.
 */
export function FaqList({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-medium">{item.q}</h3>
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-5 pr-8 text-[15px] leading-relaxed text-gray-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data for the same questions. */
export function faqSchema(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
