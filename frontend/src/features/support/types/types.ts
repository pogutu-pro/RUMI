export type SupportCategory =
  | 'technical'
  | 'billing'
  | 'booking'
  | 'maintenance'
  | 'general';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  lastUpdated: string;
}

// --- BLOG TYPES ---

export interface SupportBlogPost {
  post_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  video_url?: string;
  author: {
    id: number;
    name: string;
    profile_picture?: string;
  };
  category: string;
  tags: string[];
  read_time_minutes: number;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  video_url?: string;
  category: string;
  tags?: string[];
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {}
