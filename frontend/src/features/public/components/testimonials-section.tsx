/**
 * Placeholder testimonial content (D-10) — RumiaRent is pre-launch with no
 * real customers yet. TESTIMONIALS is a typed data array so real quotes can
 * replace these entries later with a data-only change, no layout rework.
 *
 * Intentionally no badges, star icons, or any signal implying these are
 * confirmed, real customers (plan prohibition).
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I used to track rent in a notebook and half the time I couldn't remember who'd paid. Now I open one dashboard and know exactly where every unit stands.",
    name: 'Wanjiru Kamau',
    role: 'Property Manager, Nairobi',
  },
  {
    quote:
      'Tenants pay straight into my account and I get notified the moment it lands. No more chasing people down for rent at the end of the month.',
    name: 'David Otieno',
    role: 'Landlord, Kilimani',
  },
  {
    quote:
      'Managing three properties used to mean three different spreadsheets. RumiaRent puts everything in one place, and my caretaker can update things without me.',
    name: 'Fatuma Hassan',
    role: 'Landlord, Mombasa Road',
  },
  {
    quote:
      "Setting up a new property takes minutes, not an afternoon. I've recommended it to two other landlords in my building already.",
    name: 'Brian Mwangi',
    role: 'Property Manager, Westlands',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50/60 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">What landlords are saying</h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <div
              key={name}
              className="rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="truncate-3 text-gray-600">&ldquo;{quote}&rdquo;</p>
              <p className="mt-6 font-semibold text-gray-900">{name}</p>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
