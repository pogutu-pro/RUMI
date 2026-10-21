import type { Metadata } from 'next';
import { AudiencePage, type AudienceContent } from '@/components/marketing/audience-page';

const content: AudienceContent = {
  path: '/for/agents',
  name: 'For agents',
  title: 'Property management software for agents in Kenya',
  intro:
    'For letting agents and property managers running buildings for several owners. Rent collection, owner statements, commissions and caretakers in one place.',
  points: [
    { title: 'Owner statements', body: 'A monthly statement per owner: rent collected, expenses, your fees and what is due to them.' },
    { title: 'Commissions worked out', body: 'Management and letting fees per owner, applied automatically.' },
    { title: 'Payouts on record', body: 'Record each payout to an owner; you send the money from your own bank or M-Pesa.' },
    { title: 'Rent across every building', body: 'M-Pesa payments matched and receipted for every property you manage.' },
    { title: 'Caretakers per building', body: 'Each caretaker sees only the buildings they look after.' },
    { title: 'Debt follow-up', body: 'One list of arrears with notes, promised dates, demand notes and notices.' },
  ],
  faqs: [
    {
      q: 'Can I manage properties for several owners in one account?',
      a: 'Yes. Add each property owner, link their properties, set their fees, and send each one their own statement.',
    },
    {
      q: 'Does RumiaRent pay the owners?',
      a: 'No. RumiaRent works out and records what each owner is due. You pay them from your own bank or M-Pesa, and record the payout.',
    },
    {
      q: 'Which plan suits an agency?',
      a: 'Pro covers up to 5 properties and 50 units; Enterprise has no limits. Every plan starts with a 30-day free trial.',
    },
  ],
  guides: ['choosing-rental-management-software-kenya', 'collect-rent-with-mpesa', 'tenant-deposits-kenya'],
};

export const metadata: Metadata = {
  title: 'For agents: property management software in Kenya',
  description: content.intro,
  alternates: { canonical: content.path },
};

export default function AgentsPage() {
  return <AudiencePage content={content} />;
}
