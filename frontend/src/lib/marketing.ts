/**
 * Public-site wording in one place: the home page, FAQ page, structured data
 * and llms.txt all read from here, so they never contradict each other.
 * Every claim must be true of the product today.
 */

export const TAGLINE = 'Rent collection for Kenyan landlords and agents';

export const ONE_LINER =
  'RumiaRent records every M-Pesa rent payment against the right tenant, sends the receipt and reminds whoever is late. ' +
  'Tenants keep paying your own paybill; RumiaRent never holds your money.';

export const STEPS = [
  { title: 'Add your property', body: 'Units are created for you.' },
  { title: 'Add your tenants', body: 'Each gets their own M-Pesa account number.' },
  { title: 'Get paid', body: 'Payments are matched, receipted and chased for you.' },
] as const;

export const FEATURES = [
  { key: 'mpesa', title: 'M-Pesa matching', body: 'Payments land on the right tenant, even with typos.' },
  { key: 'invoices', title: 'Receipts and invoices', body: 'Sent by SMS and email, automatically.' },
  { key: 'reminders', title: 'Reminders', body: 'Late tenants are reminded for you.' },
  { key: 'books', title: 'Statements and tax', body: 'Monthly statements and your MRI figure.' },
  { key: 'team', title: 'Caretakers and owners', body: 'Give access, send owner statements.' },
  { key: 'vacancies', title: 'Vacancy listings', body: 'Advertise empty units with one switch.' },
] as const;

export const FAQS = [
  {
    q: 'What is RumiaRent?',
    a: 'RumiaRent is rental management software for landlords and property agents in Kenya. It keeps track of tenants, rent, M-Pesa payments, receipts, reminders and arrears in one place.',
  },
  {
    q: 'Does RumiaRent hold my rent money?',
    a: 'No. Tenants pay your own M-Pesa paybill or bank account, exactly as they do today. RumiaRent only receives the payment notification, records it against the right tenant and sends the receipt.',
  },
  {
    q: 'How do tenants pay rent?',
    a: 'Through M-Pesa Pay Bill to your business number, using their own account number, which RumiaRent gives each tenant. Cash and bank payments can be recorded in a few taps.',
  },
  {
    q: 'What if a tenant types the wrong account number?',
    a: 'RumiaRent still tries to match it, for example "rent A3" or "AO3" for A03. If it cannot be sure, the payment waits for you to assign it with one tap, and the next payment with that reference is matched automatically.',
  },
  {
    q: 'How much does RumiaRent cost?',
    a: 'Plans are a flat monthly price in Kenyan shillings, chosen by how many properties and units you manage. Every plan starts with a 30-day free trial with all features, and no card is needed to start.',
  },
  {
    q: 'Do I need my own paybill?',
    a: 'A paybill gives each tenant an account number, which is what lets payments be matched automatically. Without one you can still record cash, bank and M-Pesa payments yourself, or upload your M-Pesa statement.',
  },
  {
    q: 'Can my caretaker use it?',
    a: 'Yes. Caretakers get their own login and only see the properties you assign to them. You decide whether they can record payments or add tenants.',
  },
  {
    q: 'Does it work on a phone?',
    a: 'Yes. RumiaRent works in the browser on any phone, tablet or computer. Tenants can check their balance and see how to pay from their phone.',
  },
] as const;
