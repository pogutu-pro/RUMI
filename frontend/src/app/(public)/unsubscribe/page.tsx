'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { axiosInstance as axios } from '@/lib/api/client';

type Status = 'idle' | 'working' | 'done' | 'failed';

function UnsubscribeContent() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<Status>('idle');

  // A POST on click, not on page load: mail scanners open links automatically
  // and must not be able to unsubscribe someone by accident.
  const confirm = async (): Promise<void> => {
    setStatus('working');
    try {
      await axios.post('/notifications/unsubscribe/', { token });
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  if (!token) {
    return (
      <p className="text-gray-600">
        This unsubscribe link is incomplete. Open it again from the email, or
        change your email preferences in Settings after you sign in.
      </p>
    );
  }

  if (status === 'done') {
    return (
      <p className="text-gray-700">
        You are unsubscribed from RumiaRent update emails. You will still
        receive account emails such as rent receipts, reminders and password
        resets.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Stop receiving update and marketing emails from RumiaRent? Account
        emails such as receipts and rent reminders will continue.
      </p>
      {status === 'failed' && (
        <p role="alert" className="text-sm text-red-600">
          That link is invalid or has expired. Sign in and change this under
          Settings, Notifications.
        </p>
      )}
      <Button
        onClick={confirm}
        disabled={status === 'working'}
        className="rounded-full"
      >
        {status === 'working' ? 'Unsubscribing...' : 'Unsubscribe'}
      </Button>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto max-w-xl px-4">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Email preferences
        </h1>
        <Suspense fallback={null}>
          <UnsubscribeContent />
        </Suspense>
        <p className="mt-8 text-sm text-gray-500">
          <Link
            href="/"
            className="text-primary hover:underline underline-offset-4"
          >
            Back to RumiaRent
          </Link>
        </p>
      </div>
    </section>
  );
}
