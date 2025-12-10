'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Clock, User, FileText, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for approvals
const APPROVALS = [
  {
    id: '1',
    type: 'roommate_request',
    title: 'Roommate Request',
    requester: 'John Doe',
    details: 'Requested to room with Jane Smith in Room 101',
    date: '2024-03-15T10:00:00',
    status: 'pending',
  },
  {
    id: '2',
    type: 'maintenance',
    title: 'Maintenance Completion',
    requester: 'Mike Plumber',
    details: 'Completed faucet repair in Room 205. Requires verification.',
    date: '2024-03-14T15:30:00',
    status: 'pending',
  },
  {
    id: '3',
    type: 'guest',
    title: 'Overnight Guest',
    requester: 'Alice Johnson',
    details: 'Request for sister to stay overnight on 2024-03-20',
    date: '2024-03-15T09:15:00',
    status: 'pending',
  },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = React.useState('all');

  const filteredApprovals = activeTab === 'all' 
    ? APPROVALS 
    : APPROVALS.filter(a => a.type === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Pending Approvals
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Review and action pending requests and notifications
        </p>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="roommate_request">Roommates</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="guest">Guests</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredApprovals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No pending approvals found. You're all caught up!</p>
              </div>
            ) : (
              filteredApprovals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          approval.type === 'roommate_request' ? 'bg-blue-100 text-blue-600' :
                          approval.type === 'maintenance' ? 'bg-amber-100 text-amber-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {approval.type === 'roommate_request' ? <User className="h-6 w-6" /> :
                           approval.type === 'maintenance' ? <FileText className="h-6 w-6" /> :
                           <Clock className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{approval.title}</h3>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            From: {approval.requester} • {new Date(approval.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{approval.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
