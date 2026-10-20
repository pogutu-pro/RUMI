/** Mirrors Backend home views: _job_data (public) and admin=True (staff). */
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobStatus = 'draft' | 'published' | 'closed';

export interface JobPosting {
  id: number;
  title: string;
  slug: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  employment_type_label: string;
  summary: string;
  description: string;
  requirements: string;
  apply_email: string;
  closing_date: string | null;
  published_at: string | null;
}

export interface AdminJobPosting extends JobPosting {
  status: JobStatus;
  /** Published and not past its closing date. */
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPostingInput {
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  summary: string;
  description: string;
  requirements: string;
  apply_email: string;
  closing_date: string | null;
  status: JobStatus;
}

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
