'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LandlordVerification {
  id: string;
  landlordName: string;
  email: string;
  phone: string;
  documentsSubmitted: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

const mockQueue: LandlordVerification[] = [
  {
    id: '1',
    landlordName: 'John Doe',
    email: 'john@example.com',
    phone: '+254700000000',
    documentsSubmitted: 3,
    submittedAt: new Date(),
    status: 'pending',
  },
];

export function LandlordVerificationQueue() {
  const [queue, setQueue] = useState<LandlordVerification[]>(mockQueue);

  const handleApprove = (id: string) => {
    setQueue(queue.map(item => 
      item.id === id ? { ...item, status: 'approved' as const } : item
    ));
  };

  const handleReject = (id: string) => {
    setQueue(queue.map(item => 
      item.id === id ? { ...item, status: 'rejected' as const } : item
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landlord Verification Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <h4 className="font-medium">{item.landlordName}</h4>
                  <p className="text-sm text-muted-foreground">{item.email}</p>
                  <p className="text-sm text-muted-foreground">{item.phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {item.documentsSubmitted} documents
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'pending' ? (
                    <>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(item.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  ) : (
                    <Badge
                      variant={
                        item.status === 'approved' ? 'default' : 'destructive'
                      }
                    >
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
