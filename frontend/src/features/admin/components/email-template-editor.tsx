'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to RUMI' },
  { id: 'booking-confirmed', name: 'Booking Confirmation', subject: 'Your Booking is Confirmed' },
  { id: 'payment-received', name: 'Payment Received', subject: 'Payment Confirmation' },
  { id: 'password-reset', name: 'Password Reset', subject: 'Reset Your Password' },
];

export function EmailTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState('Hello {{name}},\n\nWelcome to RUMI!');

  const handleSave = () => {
    toast.success('Email template saved successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>
          Customize email templates sent to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <TabsList className="grid w-full grid-cols-4">
            {templates.map((template) => (
              <TabsTrigger key={template.id} value={template.id}>
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  placeholder="Email content..."
                  className="font-mono text-sm"
                />
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{"{{name}}"}</Badge>
                  <Badge variant="secondary">{"{{email}}"}</Badge>
                  <Badge variant="secondary">{"{{booking_id}}"}</Badge>
                  <Badge variant="secondary">{"{{amount}}"}</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
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
