'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Briefcase, CalendarClock, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useOpenRoles } from '../hooks/use-careers';
import type { JobPosting } from '../types';

function RoleCard({ job }: { job: JobPosting }) {
  const [open, setOpen] = React.useState(false);
  const subject = encodeURIComponent(`Application: ${job.title}`);

  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-gray-900">{job.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            {job.department && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {job.department}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {job.location}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {job.employment_type_label}
            </span>
            {job.closing_date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Apply by {format(new Date(job.closing_date), 'd MMM yyyy')}
              </span>
            )}
          </div>
        </div>
        <a href={`mailto:${job.apply_email}?subject=${subject}`}>
          <Button className="rounded-full px-6">Apply</Button>
        </a>
      </div>

      {job.summary && <p className="mt-4 text-gray-700">{job.summary}</p>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
      >
        {open ? 'Hide details' : 'View details'}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-4 space-y-5 border-t border-gray-100 pt-5">
          <div>
            <h4 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-gray-500">About the role</h4>
            <p className="whitespace-pre-line text-gray-700">{job.description}</p>
          </div>
          {job.requirements && (
            <div>
              <h4 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-gray-500">Requirements</h4>
              <p className="whitespace-pre-line text-gray-700">{job.requirements}</p>
            </div>
          )}
          <p className="text-sm text-gray-600">
            To apply, email your CV and a short note to{' '}
            <a className="font-medium text-primary underline" href={`mailto:${job.apply_email}?subject=${subject}`}>
              {job.apply_email}
            </a>
            .
          </p>
        </div>
      )}
    </article>
  );
}

/** Live openings posted from the tech-support dashboard, or a quiet "not hiring" note. */
export function OpenRoles() {
  const { data: roles = [], isLoading } = useOpenRoles();

  if (isLoading) {
    return <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-3xl bg-gray-50" aria-hidden="true" />;
  }

  if (roles.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center">
        <h2 className="mb-3 text-3xl font-bold text-primary">No open roles right now</h2>
        <p className="mb-2 text-lg text-gray-600">
          We are not hiring at the moment, but we would love to hear from people who want to work on RumiaRent.
        </p>
        <p className="mb-8 text-lg text-gray-600">
          Email us at{' '}
          <a href="mailto:info@rumiarent.com" className="font-medium text-primary underline">
            info@rumiarent.com
          </a>
        </p>
        <Link href="/contact">
          <Button className="h-14 rounded-full px-10 text-lg font-medium">Contact Us</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-3xl font-bold text-primary">
        Open roles <span className="text-gray-400">({roles.length})</span>
      </h2>
      {roles.map((job) => (
        <RoleCard key={job.id} job={job} />
      ))}
      <p className="pt-2 text-center text-gray-600">
        Do not see a fit? Email{' '}
        <a href="mailto:info@rumiarent.com" className="font-medium text-primary underline">
          info@rumiarent.com
        </a>{' '}
        and tell us what you do.
      </p>
    </div>
  );
}
