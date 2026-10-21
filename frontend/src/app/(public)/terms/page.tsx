import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  alternates: { canonical: '/terms' },
  title: 'Terms of Service',
  description:
    'The terms for using RumiaRent, including subscriptions, billing and payments.',
};

const LAST_UPDATED = '19 September 2026';

interface Block {
  heading: string;
  body: React.ReactNode[];
}

const BLOCKS: Block[] = [
  {
    heading: '1. Who we are and who can use RumiaRent',
    body: [
      'RumiaRent is owned and operated by Stratnovo. By creating an account or using RumiaRent you agree to these terms. If you do not agree, please do not use the service.',
      'You must be at least 18 years old to create an account or use RumiaRent. By creating an account you confirm that you are.',
    ],
  },
  {
    heading: '2. What RumiaRent is',
    body: [
      'RumiaRent is software that helps landlords and agents in Kenya manage properties, tenants, rent charges and payments, and keep simple accounting records. We are not a party to any tenancy agreement between a landlord and a tenant, and we are not responsible for how either of them meets it.',
      'Figures such as rental income tax (MRI) are calculations to help you prepare. They are not tax, legal or accounting advice. You remain responsible for filing accurate returns with the Kenya Revenue Authority.',
    ],
  },
  {
    heading: '3. Accounts',
    body: [
      'Landlords and agents create their own accounts. Tenants and caretakers are added by invitation from a landlord or caretaker and set up their own password from an emailed link.',
      'You are responsible for keeping your password confidential and for everything done under your account. A landlord is responsible for the caretakers they invite and for having the right to enter the tenant details they add.',
    ],
  },
  {
    heading: '4. Subscriptions and billing',
    body: [
      'Every new landlord account starts with a 30-day free trial with all features unlocked. No payment card is needed to start. Before the trial ends you will be asked to choose a plan.',
      'Plans are charged monthly in Kenyan shillings (KES) at the price shown on the pricing page. Payments are processed by Paystack. Rental income tax figures and basic accounting are free on every plan.',
      'A plan renews automatically each month until it is cancelled. Some accounts are billed manually instead, and those receive a reminder before each renewal date.',
      'To cancel, contact us using the details below. Cancellation takes effect at the end of the period you have already paid for, and you keep access until then. We do not charge for any period after that.',
      'If a renewal payment fails, your account stays fully usable for a short grace period while you fix the payment. After that the account is suspended, meaning you cannot use paid features. Your records are not deleted, and access returns when payment succeeds.',
      'Payments for a period that has already started are not refundable, except where the law requires it or where we charged you in error. If we made a mistake, tell us and we will correct it.',
      'If we change a price, the change applies from your next renewal and we will tell you before it does.',
    ],
  },
  {
    heading: '5. Rent payments between tenants and landlords',
    body: [
      "When a tenant pays rent online, Paystack processes the payment and it is paid out to the landlord's payout account. RumiaRent does not hold rent money. Landlords and tenants must sort out any dispute about rent between themselves.",
      'Landlords and caretakers can also record rent received in cash, by bank transfer or directly to M-Pesa. The person recording it is responsible for making sure it is accurate.',
    ],
  },
  {
    heading: '6. Acceptable use',
    body: [
      'Do not use RumiaRent to break the law, to harass or defraud anyone, to enter details of people you have no right to record, to try to get into accounts or data that are not yours, or to disrupt the service. We may suspend accounts that do.',
    ],
  },
  {
    heading: '7. Your data',
    body: [
      'Your records belong to you. How we collect and protect personal data is described in our Privacy Policy, which forms part of these terms.',
    ],
  },
  {
    heading: '8. Availability and liability',
    body: [
      'We work to keep RumiaRent available and accurate, but the service is provided as it is and we cannot promise it will never be interrupted or free of errors.',
      'To the extent the law allows, RumiaRent is not liable for indirect or consequential loss, such as lost rent or lost profit, arising from your use of, or inability to use, the service. Nothing in these terms limits liability that cannot lawfully be limited.',
    ],
  },
  {
    heading: '9. Ending your account',
    body: [
      'You can stop using RumiaRent at any time. We may suspend or close an account that breaks these terms, or that we reasonably believe is being used fraudulently.',
    ],
  },
  {
    heading: '10. Changes to these terms',
    body: [
      'We may update these terms. We will tell account holders about significant changes, and the date above shows when they last changed. Continuing to use RumiaRent after a change means you accept it.',
    ],
  },
  {
    heading: '11. Governing law',
    body: ['These terms are governed by the laws of Kenya.'],
  },
  {
    heading: '12. Contact',
    body: [
      <>
        If you have any questions about these terms, or want to cancel a
        subscription, contact us at{' '}
        <a
          href="mailto:info@rumiarent.com"
          className="text-primary underline hover:text-primary/80"
        >
          info@rumiarent.com
        </a>
        .
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Last updated: {LAST_UPDATED}
            </p>
            <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
              {BLOCKS.map((block) => (
                <section key={block.heading}>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">
                    {block.heading}
                  </h2>
                  <div className="space-y-4 leading-relaxed">
                    {block.body.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
