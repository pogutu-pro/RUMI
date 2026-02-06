import { http, HttpResponse } from 'msw';

export const handlers = [
  // Authentication
  http.get('*/api/v1/accounts/me/', () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'student@example.com',
      role: 'student',
      first_name: 'Test',
      last_name: 'Student',
      is_verified: true,
    });
  }),

  // Hostels
  http.get('*/api/v1/hostels/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          name: 'Central Hostel',
          city: 'Nairobi',
          base_price: '5000.00',
          images: [],
          status: 'active',
        },
      ],
    });
  }),

  // Bookings
  http.post('*/api/v1/hostels/rooms/book/', async ({ request }) => {
    const data = await request.json() as any;
    return HttpResponse.json({
      booking_reference: 'BK-12345',
      status: 'pending',
      amount_due: '5000.00',
      ...data,
    }, { status: 201 });
  }),
];
