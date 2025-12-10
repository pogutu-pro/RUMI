'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { getReviews } from '@/lib/api/reviews';
import { format } from 'date-fns';
import ReviewCard from '@/components/reviews/review-card';
import ReviewStatusBadge from '@/components/reviews/review-status-badge';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '@/types/entities.types';

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: getReviews,
  });

  // Calculate stats
  const stats = {
    total: reviews.length,
    published: reviews.filter((r) => !r.status || r.status === 'published').length,
    flagged: reviews.filter((r) => r.status === 'flagged').length,
    underReview: reviews.filter((r) => r.status === 'under_review').length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
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
    return <div className="p-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Reviews Management
          </h1>
          <p className="mt-2 text-gray-600">
            Moderate and manage all hostel reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgRating}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Star className="h-6 w-6 text-amber-600 fill-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.flagged}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.underReview}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews by user or content..."
                className="pl-10 border-gray-300 focus:border-emerald-400 focus:ring-emerald-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
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
                    statusFilter === filter.value &&
                      'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-sm font-medium text-blue-900">
                {selectedReviews.length} selected
              </p>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('approve')}
                  className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('flag')}
                  className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-700"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Flag
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                  className="bg-white hover:bg-red-50 border-red-300 text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card
              key={review.id}
              className={cn(
                'border-gray-200 hover:shadow-md transition-all cursor-pointer',
                selectedReviews.includes(review.id) && 'ring-2 ring-emerald-400',
                review.status === 'flagged' && 'bg-red-50/30 border-red-200'
              )}
              onClick={() => handleSelectReview(review.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => handleSelectReview(review.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />

                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={review.user.avatar} />
                          <AvatarFallback className="bg-gray-100">
                            {review.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{review.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(review.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < review.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              )}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">
                            {review.rating}.0
                          </span>
                        </div>
                        {review.status && review.status !== 'published' && (
                          <ReviewStatusBadge status={review.status} flagReason={review.flagReason} />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {review.helpfulVotes || 0} helpful
                        </span>
                        {review.verifiedStay && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Flag className="h-4 w-4 mr-1" />
                          Flag
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-gray-200">
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reviews found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or search term
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
