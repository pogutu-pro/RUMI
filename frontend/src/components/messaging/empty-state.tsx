'use client';

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-emerald-50 p-6">
        <svg
          className="h-16 w-16 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        No messages yet
      </h2>
      <p className="max-w-sm text-sm text-gray-600">
        Start conversations with your landlord, caretaker, or student contacts.
      </p>
    </div>
  );
}
