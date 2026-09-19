import type { Metadata } from 'next';
import { FadeIn } from '@/components/animations/fade-in';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy',
  description:
    'What personal data RumiaRent collects, how it is used and shared, and your rights.',
};

const LAST_UPDATED = '19 September 2026';

interface Block {
  heading: string;
  body: React.ReactNode[];
}

const BLOCKS: Block[] = [
  {
    heading: '1. Who we are',
    body: [
      "RumiaRent is owned and operated by Stratnovo. This policy explains what personal data RumiaRent collects, why, who it is shared with, and the choices you have. It is written with Kenya's Data Protection Act, 2019 in mind.",
      "For the tenant records that a landlord or caretaker adds, the landlord decides what is entered and why. RumiaRent processes those records on the landlord's behalf to run the service.",
    ],
  },
  {
    heading: '2. What we collect',
    body: [
      'Account details: name, email address, phone number and a password, which we store only in scrambled form. For landlords, we also keep organisation and property details and the payout account used to pay out rent.',
      'Tenant records entered by a landlord or caretaker: name, phone, email, national ID number, occupation and address, next-of-kin or emergency contacts, and the tenancy, rent charge and payment history.',
      'Records you keep in RumiaRent: expenses and their receipts, messages sent between landlords, caretakers, tenants and our support team, and support tickets.',
      'Technical data: the information your browser sends when you use the site, such as IP address and device type, kept in server logs to run and secure the service.',
      'We do not collect card or bank details. Paystack collects those when a payment is made, and we only receive the result of the payment.',
    ],
  },
  {
    heading: '3. How we use it',
    body: [
      'To run RumiaRent: create accounts, track tenancies and rent, take and record payments, send receipts and rent reminders, calculate figures such as rental income tax, and give support.',
      'To keep the platform secure, prevent fraud, keep an audit trail of sensitive actions, and meet legal obligations.',
      'We send you update and marketing emails only if you turn them on in Settings, and every one has an unsubscribe link. Receipts, reminders, invitations and password resets are account emails and are sent regardless.',
      'We do not sell personal data and we do not run advertising or analytics trackers on RumiaRent.',
    ],
  },
  {
    heading: '4. Who we share it with',
    body: [
      "Only the service providers needed to run RumiaRent: Paystack for payments, Africa's Talking for SMS, our email provider for email, and our hosting provider. We also share data when the law requires it or to protect people from fraud or harm.",
      'Within an organisation, people see only what their role allows. A caretaker sees the properties they are assigned, and a tenant sees only their own tenancy and payments.',
    ],
  },
  {
    heading: '5. Where data is stored',
    body: [
      'RumiaRent is hosted on servers in Johannesburg, South Africa. Some of our providers may also process data outside Kenya. We only use providers that protect data to a reasonable standard.',
    ],
  },
  {
    heading: '6. How long we keep it',
    body: [
      'Rent charges and payments are financial records and are kept so that accounts stay correct and auditable. Other personal data is kept while your account is active and for as long as we need it for the purposes above or the law requires. You can ask us to delete personal data we no longer have a reason to keep.',
    ],
  },
  {
    heading: '7. Security',
    body: [
      "Traffic to RumiaRent is encrypted, each landlord's data is kept separate from every other landlord's, access is limited by role, and sensitive actions are logged. No system is perfectly secure, so please use a strong, unique password.",
    ],
  },
  {
    heading: '8. Cookies',
    body: [
      'We use only the cookies and local storage needed to keep you signed in, remember your settings such as light or dark mode, and let the app work offline. We do not use advertising or tracking cookies.',
    ],
  },
  {
    heading: '9. Your rights',
    body: [
      'Under the Data Protection Act you can ask to see the personal data we hold about you, have wrong data corrected, have data deleted where we have no reason to keep it, object to certain uses, and receive a copy of your data. Tenants can also ask their landlord, who decides what is recorded about them.',
      <>
        To use any of these rights, email{' '}
        <a
          href="mailto:info@rumiarent.com"
          className="text-primary underline hover:text-primary/80"
        >
          info@rumiarent.com
        </a>
        . If you are not satisfied with our answer, you can complain to the
        Office of the Data Protection Commissioner of Kenya.
      </>,
    ],
  },
  {
    heading: '10. Children',
    body: [
      'RumiaRent is for adults. You must be at least 18 to hold an account, and we do not knowingly collect data from children.',
    ],
  },
  {
    heading: '11. Changes to this policy',
    body: [
      'If we change this policy we will update it here and change the date above. For significant changes we will also tell account holders.',
    ],
  },
  {
    heading: '12. Contact',
    body: [
      <>
        Questions about this policy or your data:{' '}
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

export default function PrivacyPage() {
  return (
    <div className="flex flex-col bg-white text-gray-900">
      <section className="border-b border-gray-200 bg-white py-24 md:py-32">
        <FadeIn className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
              Privacy Policy
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
