'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  Filter,
  Flag,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { getReviews } from '@/lib/api/reviews';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import type { ReviewStatus } from '@/types/entities.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: getReviews,
  });

  const stats = {
    total: reviews?.length || 0,
    published: reviews?.filter((r) => !r.status || r.status === 'published').length || 0,
    flagged: reviews?.filter((r) => r.status === 'flagged').length || 0,
    underReview: reviews?.filter((r) => r.status === 'under_review').length || 0,
    avgRating: reviews?.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
  };

  const filteredReviews = reviews?.filter((review) => {
    const matchesSearch =
      review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (!review.status && statusFilter === 'published') ||
      review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectReview = (id: string) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'approve' | 'flag' | 'delete') => {
    console.log(`Bulk ${action} for reviews:`, selectedReviews);
    setSelectedReviews([]);
  };

  if (isLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-10 w-48" />
              <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <Skeleton className="h-[500px] rounded-xl" />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reviews Management</h1>
          <p className="mt-1 text-muted-foreground">Moderate and manage all hostel reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stats.avgRating}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{stats.flagged}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.underReview}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search reviews by user or content..."
                className="pl-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 flex-wrap">
                {[
                { value: 'all', label: 'All', count: stats.total },
                { value: 'published', label: 'Published', count: stats.published },
                { value: 'flagged', label: 'Flagged', count: stats.flagged },
                { value: 'under_review', label: 'Pending', count: stats.underReview },
                ].map((filter) => (
                <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(filter.value as typeof statusFilter)}
                    className={cn(
                        "transition-all",
                        statusFilter === filter.value && "bg-primary text-primary-foreground"
                    )}
                >
                    {filter.label} ({filter.count})
                </Button>
                ))}
            </div>
        </div>

        <AnimatePresence>
            {selectedReviews.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
                <p className="text-sm font-medium text-primary">
                {selectedReviews.length} selected
                </p>
                <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')} className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('flag')} className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <Flag className="h-4 w-4 mr-1" /> Flag
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                </div>
            </motion.div>
            )}
        </AnimatePresence>

        <div className="space-y-4">
            {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                <Card
                    key={review.id}
                    className={cn(
                    'border-border/50 hover:shadow-md transition-all cursor-pointer bg-card',
                    selectedReviews.includes(review.id) && 'ring-2 ring-primary border-primary',
                    review.status === 'flagged' && 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
                    )}
                    onClick={() => handleSelectReview(review.id)}
                >
                    <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                             <input type="checkbox" checked={selectedReviews.includes(review.id)} onChange={() => handleSelectReview(review.id)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
                        </div>

                        <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={review.user.avatar} />
                                <AvatarFallback className="bg-muted text-muted-foreground">{review.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{review.user.name}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(review.date), 'MMM d, yyyy')}</p>
                            </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn('w-3.5 h-3.5', i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/30')} />
                                    ))}
                                </div>
                                {review.status && review.status !== 'published' && (
                                    <Badge variant="outline" className={cn("capitalize text-[10px] h-5", 
                                        review.status === 'flagged' ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"
                                    )}>
                                        {review.status.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {review.helpfulVotes || 0} helpful</span>
                            {review.verifiedStay && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] h-5 px-1.5 gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Verified Stay
                                </Badge>
                            )}
                            </div>

                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">View</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive"><Flag className="mr-2 h-4 w-4" /> Flag Review</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                ))
            ) : (
                <Card className="border-border/50 border-dashed">
                <CardContent className="text-center py-12">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No reviews found matching criteria</p>
                </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
