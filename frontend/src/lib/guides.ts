/**
 * Guides that answer what Kenyan landlords ask search engines and AI
 * assistants. Each opens with a direct answer, then short sections. Rendered
 * by app/(public)/guides/[slug], listed at /guides, and included in
 * /llms-full.txt. Keep every fact checkable; cite official sources.
 */

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  ordered?: boolean;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  /** Two or three sentences that answer the question on their own. */
  answer: string;
  updated: string; // ISO date of the last factual review
  sections: GuideSection[];
  faqs?: { q: string; a: string }[];
  sources?: { label: string; url: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'collect-rent-with-mpesa',
    title: 'How to collect rent with M-Pesa in Kenya',
    description:
      'Set up an M-Pesa paybill for rent, give each tenant an account number, and record and receipt every payment without checking messages.',
    answer:
      'Use an M-Pesa paybill in your own name and give every tenant their own account number to type when paying, usually their unit number. ' +
      'That way each payment can be traced to one tenant, receipted, and taken off what they owe. A till number cannot carry an account number, so it is harder to match.',
    updated: '2026-10-21',
    sections: [
      {
        heading: 'Paybill or till for rent?',
        paragraphs: [
          'A paybill (Lipa na M-Pesa, Pay Bill) asks the payer for a business number and an account number. The account number is what tells you which tenant paid. A till (Buy Goods) only shows the payer\'s name and part of their phone number, which is not enough when tenants pay from a relative\'s phone.',
          'For rent, use a paybill registered to you or your company. The money settles straight to your account, and nobody else holds it.',
        ],
      },
      {
        heading: 'Give each tenant one account number',
        paragraphs: [
          'The simplest scheme is the unit number: A1, A2, B12. When a unit is let again, give the new tenant a new number (A1X2, for example) so a former tenant\'s late payment never lands on the new tenant\'s account.',
          'Print the paybill number and the tenant\'s account number on every invoice, reminder and receipt, so tenants never have to ask.',
        ],
      },
      {
        heading: 'Record and receipt every payment',
        list: [
          'Match the payment to the tenant using the account number they typed.',
          'Apply it to their oldest unpaid rent first, and keep any extra as credit for next month.',
          'Send a numbered receipt with the M-Pesa code, the amount and the balance left.',
          'Keep payments you cannot match in one list and assign them yourself. Never guess.',
        ],
      },
      {
        heading: 'Do it automatically',
        paragraphs: [
          'Safaricom can notify a rent system each time someone pays your paybill (the Daraja C2B service, approved per paybill through Safaricom\'s "Go Live" process). The system then matches and receipts payments within seconds. RumiaRent works this way: tenants keep paying your own paybill, and RumiaRent only reads the payment notices. It never holds the money.',
          'Once a month, compare your M-Pesa statement with what was recorded. This catches the rare payment whose notice did not arrive.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What if a tenant types the wrong account number?',
        a: 'Look at the name, amount and date and assign it by hand. Good rent software also tries close matches, such as "rent A3" or "AO3" for A03, and remembers the reference for next time.',
      },
      {
        q: 'Can tenants pay rent with M-Pesa to a bank account?',
        a: 'Yes, through the bank\'s own paybill using your bank account number as the account. In that case the tenant\'s reference often does not reach you, so matching is harder than with your own paybill.',
      },
    ],
    sources: [{ label: 'Safaricom Daraja developer portal', url: 'https://developer.safaricom.co.ke' }],
  },
  {
    slug: 'rental-income-tax-kenya',
    title: 'Monthly Rental Income (MRI) tax in Kenya: rate, deadline and how to file',
    description:
      'Kenya\'s monthly rental income tax explained: 7.5% of gross rent for resident landlords earning KES 288,000 to KES 15 million a year, due by the 20th of the next month.',
    answer:
      'Resident landlords who earn between KES 288,000 and KES 15 million a year in residential rent pay Monthly Rental Income (MRI) tax of 7.5% of the gross rent received. ' +
      'It is a final tax with no deductions for expenses, filed and paid monthly by the 20th of the following month.',
    updated: '2026-10-21',
    sections: [
      {
        heading: 'Who pays MRI',
        list: [
          'Resident individuals, partnerships and companies that earn residential rent.',
          'Gross residential rent between KES 288,000 and KES 15,000,000 a year.',
          'Below or above that band, or for commercial rent, the normal income tax rules apply instead.',
          'Non-resident landlords are taxed differently: KRA lists withholding tax at 30% of gross rent.',
        ],
      },
      {
        heading: 'How to work it out',
        paragraphs: [
          'Add up the rent actually received in the month, not the rent invoiced, and multiply by 7.5%. No expenses, repairs or losses are deducted. For example, KES 120,000 received in March means KES 9,000 MRI, due by 20 April.',
          'Keep a monthly record of rent received per property. It makes the return quick and is your evidence if KRA asks.',
        ],
      },
      {
        heading: 'How to file and pay',
        list: [
          'File the MRI return for the month on KRA\'s rental income portal (eRITS) or iTax.',
          'Generate the payment slip and pay by M-Pesa or bank by the 20th of the following month.',
          'Keep the acknowledgement and payment reference with your monthly records.',
        ],
        ordered: true,
      },
      {
        heading: 'Opting out',
        paragraphs: [
          'Eligible landlords may opt out of MRI in writing and instead declare rental income in the annual return, where expenses can be deducted. Talk to a tax adviser before choosing, and check KRA\'s current guidance, as rates and bands are reviewed in Finance Acts.',
        ],
      },
      {
        heading: 'How RumiaRent helps',
        paragraphs: [
          'RumiaRent adds up the rent you actually received each month from the payments it recorded, shows the MRI figure and the deadline, and lets you note when you filed. It does not file with KRA for you. This guide is general information, not tax advice.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is MRI charged on rent invoiced or rent received?',
        a: 'On rent received. Rent a tenant still owes is not taxed until it is paid.',
      },
      {
        q: 'Can I deduct repairs or caretaker wages from MRI?',
        a: 'No. MRI is a flat 7.5% of gross rent with no deductions. Landlords who want to deduct expenses can opt out and use the annual regime instead.',
      },
    ],
    sources: [{ label: 'KRA eRITS: rental income tax FAQs', url: 'https://erits.kra.go.ke/faqs' }],
  },
  {
    slug: 'rent-receipts-kenya',
    title: 'Rent receipts in Kenya: what to include and how to send them',
    description:
      'What a proper rent receipt in Kenya should show, why every payment needs one, and how to send numbered receipts automatically by SMS and email.',
    answer:
      'A rent receipt should show a unique receipt number, the date, the tenant and unit, the amount, how it was paid (with the M-Pesa or bank reference), what it paid for, and the balance left. ' +
      'Send one for every payment, cash included. It protects both landlord and tenant when there is a disagreement later.',
    updated: '2026-10-21',
    sections: [
      {
        heading: 'What to put on a rent receipt',
        list: [
          'A unique, sequential receipt number (RCT-000123).',
          'The date the money was received.',
          'Tenant\'s name, property and unit.',
          'Amount received, and the payment method with its reference (M-Pesa code, bank reference, or "cash").',
          'What it paid: which month\'s rent, deposit, water or other charges.',
          'The balance still owed, or credit carried forward.',
          'The landlord\'s or agent\'s name and contact.',
        ],
      },
      {
        heading: 'Why every payment needs one',
        paragraphs: [
          'Receipts settle "I already paid" disputes in seconds, support your rental income tax records, and give tenants proof they need for things like loan or visa applications. A receipt for a cash payment matters most, because there is no M-Pesa message to fall back on.',
        ],
      },
      {
        heading: 'Sending receipts automatically',
        paragraphs: [
          'Rent software can issue the receipt the moment a payment is recorded and send it by SMS, with a PDF by email. In RumiaRent every recorded payment, whether M-Pesa, bank or cash, gets a numbered receipt sent to the tenant, and the tenant can download it again from their account.',
        ],
      },
    ],
  },
  {
    slug: 'choosing-rental-management-software-kenya',
    title: 'How to choose rental management software in Kenya',
    description:
      'A practical checklist for Kenyan landlords and agents comparing property management software: M-Pesa handling, who holds the money, receipts, arrears, statements, tax and pricing.',
    answer:
      'Choose software that lets tenants pay your own M-Pesa paybill or bank account and records those payments automatically, sends receipts and reminders, shows arrears clearly, and produces monthly statements. ' +
      'Prefer a flat monthly price over a percentage of rent, and check you can export your data.',
    updated: '2026-10-21',
    sections: [
      {
        heading: '1. Who holds the rent money?',
        paragraphs: [
          'Some systems collect rent into their own account and pay you later, which adds delay, fees and risk. Others let tenants pay your own paybill or bank account and only record the payment. Ask this first.',
        ],
      },
      {
        heading: '2. How are M-Pesa payments recorded?',
        list: [
          'Does each tenant get their own account number?',
          'Are payments matched automatically when Safaricom notifies the system, or do you type them in?',
          'What happens when a tenant types the account number wrong?',
          'Can you upload an M-Pesa or bank statement to catch anything missed?',
        ],
      },
      {
        heading: '3. Receipts, reminders and arrears',
        list: [
          'A numbered receipt for every payment, by SMS and email.',
          'Reminders before and after the due date, sent automatically.',
          'One list of who owes what, with optional late fees and follow-up notes.',
        ],
      },
      {
        heading: '4. Statements, expenses and tax',
        list: [
          'Monthly statements per property, with expenses.',
          'Your monthly rental income tax (MRI) figure from rent actually received.',
          'For agents: statements and commission per property owner.',
        ],
      },
      {
        heading: '5. People, devices and data',
        list: [
          'Caretaker logins limited to their own buildings.',
          'Works on a phone, for you and for tenants.',
          'Export to PDF and CSV, so your records are never locked in.',
        ],
      },
      {
        heading: '6. Pricing',
        paragraphs: [
          'Compare a flat monthly price with a percentage of rent collected: at KES 300,000 a month in rent, even 2% is KES 6,000 every month. Ask whether SMS is included and whether there is a free trial with your real tenants.',
        ],
      },
      {
        heading: 'Where RumiaRent fits',
        paragraphs: [
          'RumiaRent is built around these points: tenants pay your own paybill, payments are matched and receipted automatically, reminders and arrears are handled, and statements and MRI figures are ready each month, for a flat monthly price with a 30-day free trial.',
        ],
      },
    ],
  },
  {
    slug: 'late-rent-kenya',
    title: 'What to do when a tenant pays rent late in Kenya',
    description:
      'A calm, step-by-step way for Kenyan landlords to handle late rent: reminders, conversations, payment plans, written demands and when to get legal advice.',
    answer:
      'Remind early and in writing, talk to the tenant, and agree a dated payment plan if they need one. ' +
      'If that fails, send a formal written demand and keep records of everything. Before any eviction step, get advice from an advocate on the lawful process; do not lock a tenant out or remove their belongings yourself.',
    updated: '2026-10-21',
    sections: [
      {
        heading: 'Step by step',
        ordered: true,
        list: [
          'Send a friendly reminder a few days before the due date, with your paybill and their account number.',
          'On the day after it is due, send a second reminder and call.',
          'If they are struggling, agree a payment plan with dates and amounts, in writing.',
          'Apply any late fee only if your lease allows it, and apply it the same way for every tenant.',
          'If payments stop, send a formal demand letter stating the amount and a deadline.',
          'Before any notice to quit or eviction, get advice from an advocate on the law that applies to your tenancy.',
        ],
      },
      {
        heading: 'Keep records',
        paragraphs: [
          'Dated invoices, receipts, reminders and notes of calls are your evidence if the matter goes further. Rent software keeps these automatically.',
        ],
      },
      {
        heading: 'How RumiaRent helps',
        paragraphs: [
          'RumiaRent sends reminders before and after the due date, can add late fees by your rules, shows every tenant in arrears in one list with notes and promised payment dates, and can produce demand notes. This guide is general information, not legal advice.',
        ],
      },
    ],
  },
  {
    slug: 'tenant-deposits-kenya',
    title: 'Handling tenant deposits in Kenya: holding, deductions and refunds',
    description:
      'How Kenyan landlords can record a rent deposit, inspect at move-out, make fair itemised deductions and refund the balance promptly.',
    answer:
      'Record the deposit as money you are holding for the tenant, not as income. ' +
      'At move-out, inspect against the move-in condition, deduct only for unpaid rent, bills or damage beyond normal wear, list every deduction in writing, and refund the balance within the time your lease sets.',
    updated: '2026-10-21',
    sections: [
      {
        heading: 'At move-in',
        list: [
          'Put the deposit amount and the refund terms in the lease.',
          'Give a receipt for the deposit, separate from rent.',
          'Record the unit\'s condition with dated photos, signed by both of you.',
        ],
      },
      {
        heading: 'At move-out',
        list: [
          'Inspect the unit with the tenant and compare with the move-in record.',
          'Deduct only unpaid rent, unpaid bills, and damage beyond normal wear and tear.',
          'Write down each deduction with its amount and reason, and share it.',
          'Refund the balance by M-Pesa or bank and keep the reference.',
        ],
      },
      {
        heading: 'Using the deposit as last month\'s rent',
        paragraphs: [
          'Tenants sometimes ask to use the deposit for their final month. If you agree, record it as a transfer from deposit to rent, so your books and the tenant\'s balance stay correct.',
        ],
      },
      {
        heading: 'How RumiaRent helps',
        paragraphs: [
          'RumiaRent records deposits as money held, not income, and produces a move-out settlement listing each deduction and the refund due. It records the refund but does not send the money for you. This guide is general information, not legal advice.',
        ],
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
