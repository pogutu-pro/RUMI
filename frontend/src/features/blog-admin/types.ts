// Mirrors BlogPost.CATEGORY_CHOICES in Backend/home/models.py — the value
// on the left is the backend's stored key (never renamed, it's an API
// contract), the label on the right is what tech support sees. Two labels
// are deliberately not literal translations of their key
// (student_stories -> "Tenant Stories", housing_guides -> "Rental Guides")
// to match the "student" -> "tenant" wording cleanup already done on the
// public blog pages (frontend/src/app/(public)/blog/page.tsx).
export const BLOG_CATEGORIES: { value: string; label: string }[] = [
  { value: 'company_news', label: 'Company News' },
  { value: 'product_updates', label: 'Product Updates' },
  { value: 'landlord_tips', label: 'Landlord Tips' },
  { value: 'student_stories', label: 'Tenant Stories' },
  { value: 'housing_guides', label: 'Rental Guides' },
  { value: 'marketplace_highlights', label: 'Marketplace Highlights' },
];

export interface AdminBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author: { id: string; name: string };
  category: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  is_featured: boolean;
  read_time_minutes: number | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  content: string;
  category: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
  is_featured?: boolean;
  read_time_minutes?: number | null;
}
