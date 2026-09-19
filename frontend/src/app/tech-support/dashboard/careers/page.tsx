'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Eye, EyeOff, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  useAdminJobPostings, useCreateJobPosting, useDeleteJobPosting, useUpdateJobPosting,
} from '@/features/careers/hooks/use-careers';
import { EMPLOYMENT_TYPES, type AdminJobPosting, type JobPostingInput } from '@/features/careers/types';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

const schema = z.object({
  title: z.string().trim().min(3, 'Give the role a title').max(200),
  department: z.string().trim().max(100),
  location: z.string().trim().min(1, 'Where is the role based?').max(150),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  summary: z.string().trim().max(300, 'Keep the summary under 300 characters'),
  description: z.string().trim().min(20, 'Describe the role in a bit more detail'),
  requirements: z.string().trim(),
  apply_email: z.string().trim().email('Enter a valid email address'),
  closing_date: z.string(),
  status: z.enum(['draft', 'published']),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  title: '', department: '', location: 'Nairobi, Kenya', employment_type: 'full_time', summary: '',
  description: '', requirements: '', apply_email: 'info@rumiarent.com', closing_date: '', status: 'published',
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  published: { label: 'Live', variant: 'default' },
  draft: { label: 'Draft', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'outline' },
};

function RoleDialog({ job, open, onClose }: { job: AdminJobPosting | null; open: boolean; onClose: () => void }) {
  const create = useCreateJobPosting();
  const update = useUpdateJobPosting();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const pending = create.isPending || update.isPending;

  React.useEffect(() => {
    if (!open) return;
    form.reset(
      job
        ? {
            title: job.title, department: job.department, location: job.location,
            employment_type: job.employment_type, summary: job.summary, description: job.description,
            requirements: job.requirements, apply_email: job.apply_email, closing_date: job.closing_date ?? '',
            status: job.status === 'published' ? 'published' : 'draft',
          }
        : EMPTY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: JobPostingInput = { ...values, closing_date: values.closing_date || null };
    try {
      if (job) await update.mutateAsync({ id: job.id, payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch {
      // the hooks show the error toast; keep the dialog open
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit role' : 'Post a role'}</DialogTitle>
          <DialogDescription>
            Published roles appear on the public Careers page straight away. Save as a draft to keep it private
            until you are ready.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl><Input className="h-11" placeholder="e.g. Customer Success Associate" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormRow>
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Team (optional)</FormLabel>
                  <FormControl><Input className="h-11" placeholder="e.g. Engineering" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input className="h-11" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>

            <FormRow>
              <FormField control={form.control} name="employment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="closing_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply by (optional)</FormLabel>
                  <FormControl><Input className="h-11" type="date" {...field} /></FormControl>
                  <FormDescription>The role leaves the site by itself after this date.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>

            <FormField control={form.control} name="summary" render={({ field }) => (
              <FormItem>
                <FormLabel>One-line summary</FormLabel>
                <FormControl><Input className="h-11" placeholder="Shown on the list before someone opens the role" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>About the role</FormLabel>
                <FormControl><Textarea rows={6} placeholder="What will they do day to day?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="requirements" render={({ field }) => (
              <FormItem>
                <FormLabel>Requirements (optional)</FormLabel>
                <FormControl><Textarea rows={4} placeholder="Skills and experience, one per line" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormRow>
              <FormField control={form.control} name="apply_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Applications go to</FormLabel>
                  <FormControl><Input className="h-11" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="published">Published on the careers page</SelectItem>
                      <SelectItem value="draft">Draft (private)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </FormRow>

            <FormDialogActions submitLabel={job ? 'Save changes' : 'Save role'} isPending={pending} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CareersAdminPage() {
  const { data: jobs = [], isLoading } = useAdminJobPostings();
  const { pageItems: pagedJobs, pagerProps: jobsPager } = usePagination(jobs, 10);
  const update = useUpdateJobPosting();
  const remove = useDeleteJobPosting();
  const [dialog, setDialog] = React.useState<{ open: boolean; job: AdminJobPosting | null }>({ open: false, job: null });
  const [toDelete, setToDelete] = React.useState<AdminJobPosting | null>(null);

  const setStatus = (job: AdminJobPosting, status: 'draft' | 'published' | 'closed') =>
    update.mutate({ id: job.id, payload: { status } });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Careers"
        description="Post the roles you are hiring for. They appear on the public Careers page."
        action={
          <Button onClick={() => setDialog({ open: true, job: null })} leftIcon={<Plus className="h-4 w-4" />}>
            Post a role
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <EmptyState
          variant="add"
          title="No roles posted"
          description="When you are hiring, post the role here and it goes live on the careers page."
        />
      ) : (
        <>
        <ul className="divide-y rounded-2xl border">
          {pagedJobs.map((job) => {
            const badge = STATUS_BADGE[job.status];
            const expired = job.status === 'published' && !job.is_open;
            return (
              <li key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-foreground">{job.title}</p>
                    <Badge variant={badge.variant}>{expired ? 'Expired' : badge.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[job.department, job.location, job.employment_type_label].filter(Boolean).join(' · ')}
                    {job.closing_date && ` · apply by ${format(new Date(job.closing_date), 'd MMM yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {job.status === 'published' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(job, 'draft')} leftIcon={<EyeOff className="h-4 w-4" />}>
                        Unpublish
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(job, 'closed')} leftIcon={<Lock className="h-4 w-4" />}>
                        Close
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(job, 'published')} leftIcon={<Eye className="h-4 w-4" />}>
                      {job.status === 'closed' ? 'Reopen' : 'Publish'}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" aria-label={`Edit ${job.title}`} onClick={() => setDialog({ open: true, job })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${job.title}`} onClick={() => setToDelete(job)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <SimplePager {...jobsPager} />
        </>
      )}

      <RoleDialog job={dialog.job} open={dialog.open} onClose={() => setDialog((d) => ({ ...d, open: false }))} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{toDelete?.title}&rdquo; is removed from the careers page for good. To take it down but keep it,
              use Unpublish or Close instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
