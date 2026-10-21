'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Copies each column heading onto its cells as data-label, so on phones the
 * `rr-stack` styles (styles/globals.css) can show every row as a small card:
 * first cell as the title, then "Heading: value" lines. Re-runs when rows change.
 */
function useStackLabels(table: React.RefObject<HTMLTableElement | null>) {
  React.useEffect(() => {
    const el = table.current;
    if (!el) return;
    const label = () => {
      const heads = Array.from(el.querySelectorAll('thead th')).map((th) => (th.textContent || '').trim());
      el.querySelectorAll('tbody tr').forEach((tr) => {
        Array.from(tr.children).forEach((cell, i) => {
          const text = heads[i] ?? '';
          if (cell.getAttribute('data-label') !== text) cell.setAttribute('data-label', text);
        });
      });
    };
    label();
    const observer = new MutationObserver(label);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [table]);
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Keep a real table on phones (wide data people scroll sideways through on purpose). */
  noStack?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, noStack, ...props }, ref) => {
  const inner = React.useRef<HTMLTableElement | null>(null);
  React.useImperativeHandle(ref, () => inner.current as HTMLTableElement);
  useStackLabels(inner);
  return (
    <div className="relative w-full overflow-x-auto">
      <table ref={inner} className={cn('w-full caption-bottom text-sm', !noStack && 'rr-stack', className)} {...props} />
    </div>
  );
});
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-muted/50 font-medium text-muted-foreground', className)} {...props} />
  ),
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-12 px-4 text-left align-middle text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle text-sm', className)} {...props} />
  ),
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
