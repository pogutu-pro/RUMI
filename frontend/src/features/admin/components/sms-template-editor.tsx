'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Save } from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  { id: 'booking-confirmed', name: 'Booking Confirmed' },
  { id: 'payment-received', name: 'Payment Received' },
  { id: 'verification-approved', name: 'Verification Approved' },
];

export function SmsTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [message, setMessage] = useState('Your booking #{{booking_id}} is confirmed!');

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160);

  const handleSave = () => {
    toast.success('SMS template saved successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Templates</CardTitle>
        <CardDescription>
          Customize SMS notifications sent to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <TabsList className="grid w-full grid-cols-3">
            {templates.map((template) => (
              <TabsTrigger key={template.id} value={template.id}>
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="SMS message..."
                  maxLength={480}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{characterCount} characters</span>
                  <span>{smsCount} SMS</span>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setMessage(message + '{{name}}')}>
                    {"{{name}}"}
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setMessage(message + '{{booking_id}}')}>
                    {"{{booking_id}}"}
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setMessage(message + '{{amount}}')}>
                    {"{{amount}}"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
