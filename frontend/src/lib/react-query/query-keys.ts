export type QueryKey = readonly unknown[];

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: (): QueryKey => [...queryKeys.auth.all, 'profile'] as QueryKey,
    user: (): QueryKey => [...queryKeys.auth.all, 'user'] as QueryKey,
  },
  hostels: {
    all: ['hostels'] as const,

    list: <
      F extends Record<string, unknown> | undefined =
        | Record<string, unknown>
        | undefined,
    >(
      filters?: F,
    ): QueryKey =>
      [...queryKeys.hostels.all, 'list', filters ?? null] as QueryKey,

    detail: (id: string): QueryKey =>
      [...queryKeys.hostels.all, 'detail', id] as QueryKey,

    rooms: (hostelId: string): QueryKey =>
      [...queryKeys.hostels.all, 'rooms', hostelId] as QueryKey,

    hostel: (slug: string, options?: Record<string, unknown>): QueryKey =>
      [...queryKeys.hostels.all, 'hostel', slug, options ?? null] as QueryKey,

    relatedHostels: (slug: string): QueryKey =>
      [...queryKeys.hostels.all, 'relatedHostels', slug] as QueryKey,

    availability: (hostelId: string, date?: Date): QueryKey =>
      [
        ...queryKeys.hostels.all,
        'availability',
        hostelId,
        date ?? null,
      ] as QueryKey,

    bookings: (): QueryKey =>
      [...queryKeys.hostels.all, 'bookings'] as QueryKey,

    reviews: (hostelId: string): QueryKey =>
      [...queryKeys.hostels.all, 'reviews', hostelId] as QueryKey,

    landlordHostels: (): QueryKey =>
      [...queryKeys.hostels.all, 'landlordHostels'] as QueryKey,
  },

  bookings: {
    all: ['bookings'] as const,
    list: <
      F extends Record<string, unknown> | undefined =
        | Record<string, unknown>
        | undefined,
    >(
      filters?: F,
    ): QueryKey =>
      [...queryKeys.bookings.all, 'list', filters ?? null] as QueryKey,
    detail: (id: string): QueryKey =>
      [...queryKeys.bookings.all, 'detail', id] as QueryKey,
    user: (userId: string): QueryKey =>
      [...queryKeys.bookings.all, 'user', userId] as QueryKey,
  },
  damageReports: {
    all: ['damageReports'] as const,
    list: <
      F extends Record<string, unknown> | undefined =
        | Record<string, unknown>
        | undefined,
    >(
      filters?: F,
    ): QueryKey =>
      [...queryKeys.damageReports.all, 'list', filters ?? null] as QueryKey,
    detail: (id: string): QueryKey =>
      [...queryKeys.damageReports.all, 'detail', id] as QueryKey,
  },
  inventory: {
    all: ['inventory'] as const,
    list: <
      F extends Record<string, unknown> | undefined =
        | Record<string, unknown>
        | undefined,
    >(
      filters?: F,
    ): QueryKey =>
      [...queryKeys.inventory.all, 'list', filters ?? null] as QueryKey,
    booking: (bookingId: string): QueryKey =>
      [...queryKeys.inventory.all, 'booking', bookingId] as QueryKey,
    template: (hostelId: string): QueryKey =>
      [...queryKeys.inventory.all, 'template', hostelId] as QueryKey,
  },
  payments: {
    all: ['payments'] as const,
    list: <F extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
      filters?: F
    ): QueryKey => [...queryKeys.payments.all, 'list', filters ?? null] as QueryKey,
    transactions: (): QueryKey =>
      [...queryKeys.payments.all, 'transactions'] as QueryKey,
    methods: (): QueryKey => [...queryKeys.payments.all, 'methods'] as QueryKey,
    recurring: (): QueryKey =>
      [...queryKeys.payments.all, 'recurring'] as QueryKey,
    stats: (): QueryKey => [...queryKeys.payments.all, 'stats'] as QueryKey,
  },
  messaging: {
    all: ['messaging'] as const,
    conversations: (): QueryKey => ['messaging', 'conversations'] as QueryKey,
    detail: (conversationId: string): QueryKey => ['messaging', 'conversation', conversationId] as QueryKey,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly?: boolean): QueryKey =>
      [...queryKeys.notifications.all, 'list', Boolean(unreadOnly)] as QueryKey,
    preferences: (): QueryKey =>
      [...queryKeys.notifications.all, 'preferences'] as QueryKey,
  },
  analytics: {
    dashboard: (period: string): QueryKey => ['analytics', 'dashboard', period] as QueryKey,
  },
  users: {
    all: ['users'] as const,
    list: <F extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
      filters?: F
    ): QueryKey => [...queryKeys.users.all, 'list', filters ?? null] as QueryKey,
    detail: (id: string): QueryKey => [...queryKeys.users.all, 'detail', id] as QueryKey,
  },
  reviews: {
    all: ['reviews'] as const,
    list: <F extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
      filters?: F
    ): QueryKey => [...queryKeys.reviews.all, 'list', filters ?? null] as QueryKey,
  },
  support: {
    all: ['support'] as const,
    tickets: <F extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
      filters?: F
    ): QueryKey => [...queryKeys.support.all, 'tickets', filters ?? null] as QueryKey,
  },
  transfers: {
    all: ['transfers'] as const,
    list: <F extends Record<string, unknown> | undefined = Record<string, unknown> | undefined>(
      filters?: F
    ): QueryKey => [...queryKeys.transfers.all, 'list', filters ?? null] as QueryKey,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    plans: (): QueryKey => [...queryKeys.subscriptions.all, 'plans'] as QueryKey,
    plan: (id: string): QueryKey => [...queryKeys.subscriptions.all, 'plan', id] as QueryKey,
    mySubscription: (): QueryKey => [...queryKeys.subscriptions.all, 'mySubscription'] as QueryKey,
    featureAccess: (feature: string): QueryKey => [...queryKeys.subscriptions.all, 'featureAccess', feature] as QueryKey,
  },
  public: {
    all: ['public'] as const,
    landing: (): QueryKey => [...queryKeys.public.all, 'landing'] as QueryKey,
    about: (): QueryKey => [...queryKeys.public.all, 'about'] as QueryKey,
    team: (): QueryKey => [...queryKeys.public.all, 'team'] as QueryKey,
    faqs: (): QueryKey => [...queryKeys.public.all, 'faqs'] as QueryKey,
    blog: {
      all: ['public', 'blog'] as const,
      list: (page: number, limit: number): QueryKey => [...queryKeys.public.blog.all, 'list', { page, limit }] as QueryKey,
      detail: (slug: string): QueryKey => [...queryKeys.public.blog.all, 'detail', slug] as QueryKey,
    },
  },

  // Student Dashboard
  studentDashboard: {
    all: ['studentDashboard'] as const,
    data: () => [...queryKeys.studentDashboard.all, 'data'] as const,
    rentStatus: () => [...queryKeys.studentDashboard.all, 'rentStatus'] as const,
    transactions: (limit?: number) => 
      [...queryKeys.studentDashboard.all, 'transactions', { limit }] as const,
    messages: () => [...queryKeys.studentDashboard.all, 'messages'] as const,
    tickets: () => [...queryKeys.studentDashboard.all, 'tickets'] as const,
    activity: (limit?: number) => 
      [...queryKeys.studentDashboard.all, 'activity', { limit }] as const,
  },
} as const;
