'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Eye, Home } from 'lucide-react';

interface Hostel {
  id: string;
  name: string;
  location: string;
  landlord: string;
  rooms: number;
  price: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface HostelApprovalCardProps {
  hostel: Hostel;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
}

export function HostelApprovalCard({
  hostel,
  onApprove,
  onReject,
  onView,
}: HostelApprovalCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{hostel.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{hostel.location}</p>
            </div>
          </div>
          <Badge
            variant={
              hostel.status === 'approved'
                ? 'default'
                : hostel.status === 'rejected'
                ? 'destructive'
                : 'secondary'
            }
          >
            {hostel.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Landlord</p>
            <p className="font-medium">{hostel.landlord}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rooms</p>
            <p className="font-medium">{hostel.rooms} rooms</p>
          </div>
          <div>
            <p className="text-muted-foreground">Starting Price</p>
            <p className="font-medium">KES {hostel.price.toLocaleString()}/mo</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submitted</p>
            <p className="font-medium">
              {new Date(hostel.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {hostel.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView?.(hostel.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject?.(hostel.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove?.(hostel.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
