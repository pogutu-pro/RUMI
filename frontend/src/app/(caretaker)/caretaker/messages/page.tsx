'use client';

import StudentMessagesPage from '@/app/(student)/student/messages/page';

// Caretaker messages page - same UI as student, just different role context
export default function CaretakerMessagesPage() {
  return <StudentMessagesPage />;
}
