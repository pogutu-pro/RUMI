'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Plus, Trash2, Check, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = React.useState([
    {
      id: '1',
      type: 'mpesa',
      label: 'M-Pesa',
      details: '+254 712 345 678',
      isDefault: true,
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<'mpesa' | 'card' | null>(null);
  const [formData, setFormData] = React.useState({ phone: '', cardNumber: '', expiryDate: '', cvv: '', cardName: '' });

  const handleDeleteMethod = (methodId: string) => {
    setMethods(methods.filter(method => method.id !== methodId));
    toast.success('Payment method removed');
  };

  const handleSetDefault = (methodId: string) => {
    setMethods(methods.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })));
    toast.success('Default payment method updated');
  };

  const handleAddMethod = () => {
    if (selectedType === 'mpesa' && formData.phone) {
      const newMethod = {
        id: Date.now().toString(),
        type: 'mpesa',
        label: 'M-Pesa',
        details: formData.phone,
        isDefault: methods.length === 0,
      };
      setMethods([...methods, newMethod]);
      toast.success('M-Pesa number added successfully');
    } else if (selectedType === 'card' && formData.cardNumber) {
      const newMethod = {
        id: Date.now().toString(),
        type: 'card',
        label: 'Bank Card',
        details: `**** **** **** ${formData.cardNumber.slice(-4)}`,
        isDefault: methods.length === 0,
      };
      setMethods([...methods, newMethod]);
      toast.success('Bank card added successfully');
    }
    setIsDialogOpen(false);
    setSelectedType(null);
    setFormData({ phone: '', cardNumber: '', expiryDate: '', cvv: '', cardName: '' });
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!selectedType ? (
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="h-16 justify-start gap-4"
                    onClick={() => setSelectedType('mpesa')}
                  >
                    <Smartphone className="h-6 w-6 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold">M-Pesa</div>
                      <div className="text-sm text-muted-foreground">Mobile money payment</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 justify-start gap-4"
                    onClick={() => setSelectedType('card')}
                  >
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold">Bank Card</div>
                      <div className="text-sm text-muted-foreground">Debit or credit card</div>
                    </div>
                  </Button>
                </div>
              ) : selectedType === 'mpesa' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">M-Pesa Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+254 7XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedType(null)}>Back</Button>
                    <Button onClick={handleAddMethod} disabled={!formData.phone}>Add M-Pesa</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={formData.cardName}
                      onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedType(null)}>Back</Button>
                    <Button onClick={handleAddMethod} disabled={!formData.cardNumber}>Add Card</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods List */}
      <div className="grid gap-4">
        {methods.map((method) => (
          <Card key={method.id} className="bg-card">
            <CardContent className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  {method.type === 'mpesa' ? (
                    <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  )}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="dark:border-gray-700"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Set Default
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 dark:border-gray-700"
                  onClick={() => handleDeleteMethod(method.id)}
                >
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
