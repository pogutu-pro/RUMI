'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  Upload,
  Home,
  Sofa,
  Bed,
  Lamp,
  Monitor,
  Utensils,
  ArrowRight,
  ClipboardCheck,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '@/hooks/use-inventory';
import type { InventoryItem, InventoryReport } from '@/features/inventory';
import { inventoryApi } from '@/features/inventory';
import { cn } from '@/lib/utils/cn';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  furniture: Sofa,
  bedding: Bed,
  lighting: Lamp,
  electronics: Monitor,
  kitchenware: Utensils,
  other: Package,
};

export default function Page() {
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useInventory();
  const [pendingReports, setPendingReports] = React.useState<InventoryReport[]>([]);
  const [loadingReports, setLoadingReports] = React.useState(true);

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const reports = await inventoryApi.getPendingReports('caretaker');
        setPendingReports(reports);
      } catch (err) {
        console.error('Failed to fetch pending reports', err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRoom, setSelectedRoom] = React.useState<string>('all');
  const [selectedCondition, setSelectedCondition] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Get unique rooms and categories
  const rooms = React.useMemo(() => {
    const uniqueRooms = Array.from(new Set(items.map(item => item.location)));
    return uniqueRooms.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });
  }, [items]);

  const categories = React.useMemo(() => {
    return Array.from(new Set(items.map(item => item.category).filter(Boolean)));
  }, [items]);

  // Filter items
  const filteredItems= React.useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRoom = selectedRoom === 'all' || item.location === selectedRoom;
      const matchesCondition = selectedCondition === 'all' || item.condition === selectedCondition;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesRoom && matchesCondition && matchesCategory;
    });
  }, [items, searchQuery, selectedRoom, selectedCondition, selectedCategory]);

  // Calculate summary
  const summary = React.useMemo(() => {
    const total = filteredItems.length;
    const good = filteredItems.filter(i => i.condition === 'good').length;
    const worn = filteredItems.filter(i => i.condition === 'worn').length;
    const damaged = filteredItems.filter(i => i.condition === 'damaged').length;
    const missing = filteredItems.filter(i => i.condition === 'missing').length;

    return { total, good, worn, damaged, missing };
  }, [filteredItems]);

  const getConditionIcon = (condition: InventoryItem['condition']) => {
    switch (condition) {
      case 'good':
        return CheckCircle2;
      case 'worn':
        return AlertCircle;
      case 'damaged':
        return AlertTriangle;
      case 'missing':
        return XCircle;
      default:
        return Package;
    }
  };

  const getConditionColor = (condition: InventoryItem['condition']) => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'worn':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'damaged':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'missing':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Track and manage all hostel inventory items, monitor conditions, and verify reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

       {/* Pending Tasks Section */}
       <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Pending Verifications
            {pendingReports.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingReports.length}</Badge>
            )}
          </h2>
          {loadingReports ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               <Skeleton className="h-40" /><Skeleton className="h-40" />
             </div>
          ) : pendingReports.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {pendingReports.map(report => (
                 <Card key={report.id} className="hover:shadow-md transition-all border-l-4 border-l-amber-400">
                   <CardContent className="p-4 space-y-3">
                     <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            {report.type === 'check_in' ? 'Check-In' : 'Check-Out'}
                          </Badge>
                          <h3 className="font-bold text-lg mt-2">Room {report.roomNumber}</h3>
                          <p className="text-sm text-muted-foreground">Student ID: {report.studentId}</p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                     </div>
                     <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
                        <span>Submitted: {new Date(report.createdAt).toLocaleDateString()}</span>
                     </div>
                     <Button className="w-full" size="sm" onClick={() => router.push(`/caretaker/inventory/verify/${report.id}`)}>
                        Verify Report <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                   </CardContent>
                 </Card>
               ))}
             </div>
          ) : (
             <Card className="bg-muted/30 border-dashed">
               <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500/50" />
                  <p>All caught up! No pending verifications.</p>
               </CardContent>
             </Card>
          )}
       </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All tracked items</p>
          </CardContent>
        </Card>

        {/* ... (Rest of summary cards same as before) */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Good Details</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.good}</div>
          </CardContent>
        </Card>

         {/* ... (Rest of status cards) */}
         <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Damaged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.damaged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table (Kept as is below) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Master Inventory</CardTitle>
              <CardDescription>Full list of all items in database</CardDescription>
            </div>
             {/* Filters moved inline or condensed if needed */}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="font-semibold mb-2">Failed to load inventory</h3>
              <p className="text-sm text-muted-foreground mb-4">Please try again later</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No items found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const ConditionIcon = getConditionIcon(item.condition);
                    const CategoryIcon = CATEGORY_ICONS[item.category || 'other'] || Package;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.category || 'Other'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-3.5 w-3.5 text-muted-foreground" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", getConditionColor(item.condition))}>
                            <ConditionIcon className="mr-1 h-3 w-3" />
                            {item.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
