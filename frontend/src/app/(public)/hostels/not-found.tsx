import EmptyState from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function NotFound() {
  return (
    <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center">
      <EmptyState
        title="No Hostels Found"
        description="We couldn't find any hostels matching your search. Try adjusting your filters or search for something else."
        variant="search"
      />
      <Link href="/hostels">
        <Button variant="outline" size="lg" className="mt-6">
          Reset Search
        </Button>
      </Link>
    </div>
  );
}
