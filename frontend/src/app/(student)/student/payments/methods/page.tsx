'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Plus, Trash2, Check } from 'lucide-react';

export default function PaymentMethodsPage() {
  // TODO: Fetch from API
  const [methods, setMethods] = React.useState([
    {
      id: '1',
      type: 'mpesa',
      label: 'M-Pesa',
      details: '+254 712 345 678',
      isDefault: true,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/payments">
          <Button variant="ghost" size="sm" className="dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Payment Methods
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your saved payment options
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      {/* Payment Methods List */}
      <div className="grid gap-4">
        {methods.map((method) => (
          <Card key={method.id} className="bg-card">
            <CardContent className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {method.label}
                    </p>
                    {method.isDefault && (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        <Check className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.details}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!method.isDefault && (
                  <Button variant="outline" size="sm" className="dark:border-gray-700">
                    Set Default
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-red-600 dark:border-gray-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state if no methods */}
      {methods.length === 0 && (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No payment methods
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a payment method to make transactions easier
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
