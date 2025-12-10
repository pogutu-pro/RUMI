'use client';

import StudentMessagesPage from '@/app/(student)/student/messages/page';

// Landlord messages page - same UI as student, just different role context
export default function LandlordMessagesPage() {
  return <StudentMessagesPage />;
}
