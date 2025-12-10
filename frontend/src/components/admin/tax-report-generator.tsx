'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function TaxReportGenerator() {
  const [reportType, setReportType] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Tax report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Report Generator</CardTitle>
        <CardDescription>
          Generate tax reports for compliance and accounting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Summary</SelectItem>
              <SelectItem value="quarterly">Quarterly Summary</SelectItem>
              <SelectItem value="annual">Annual Summary</SelectItem>
              <SelectItem value="vat">VAT Report</SelectItem>
              <SelectItem value="income">Income Tax Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Period</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
          <h4 className="font-medium">Report Will Include:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Total revenue and commissions</li>
            <li>• Taxable income breakdown</li>
            <li>• Payment processor fees</li>
            <li>• Landlord payouts</li>
            <li>• Platform operational costs</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button variant="outline" disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
