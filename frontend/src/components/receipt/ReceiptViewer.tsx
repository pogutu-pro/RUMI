/**
 * ReceiptViewer Component
 * React component for displaying and managing payment receipts
 */

import React, { useState, useEffect } from 'react';
import { receiptAPI, receiptUtils, Receipt } from '@/lib/receipt-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, Calendar, User, Home, CreditCard } from 'lucide-react';

interface ReceiptViewerProps {
  transactionId: number;
  className?: string;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({
  transactionId,
  className = '',
}) => {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        const receiptData = await receiptAPI.getReceipt(transactionId);
        setReceipt(receiptData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [transactionId]);

  const handleDownloadPDF = () => {
    if (receipt?.pdf_file) {
      receiptUtils.downloadReceiptFile(
        receipt.pdf_file,
        `receipt-${receipt.receipt_number}.pdf`
      );
    }
  };

  const handleOpenPDF = () => {
    if (receipt?.pdf_file) {
      receiptUtils.openReceiptPDF(receipt.pdf_file);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading receipt...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading receipt</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!receipt) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-gray-600">
            <p>Receipt not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { transaction_details: td } = receipt;

  return (
    <Card className={className}>
      <CardHeader className="bg-green-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Receipt
          </CardTitle>
          <Badge variant="outline" className="text-green-700 border-green-300">
            {receipt.receipt_number}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Email Status */}
        {receipt.email_sent && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Receipt emailed to {td.student.email}
            </span>
          </div>
        )}

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{td.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{td.student.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Booking Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hostel:</span>
                <span className="font-medium">{td.booking.hostel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium">{td.booking.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">
                  {receiptUtils.formatDate(td.booking.check_in_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium">
                  {receiptUtils.formatDate(td.booking.check_out_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Rent:</span>
              <span>{receiptUtils.formatCurrency(td.payment_details.base_rent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Fee (2%):</span>
              <span>{receiptUtils.formatCurrency(td.payment_details.service_fee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total Paid:</span>
              <span className="text-green-600">
                {receiptUtils.formatCurrency(td.payment_details.total_charged)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 block">Transaction Reference</span>
            <span className="font-mono font-medium">{td.transaction_reference}</span>
          </div>
          <div>
            <span className="text-gray-600 block">Payment Date</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {receiptUtils.formatDate(td.payment_details.paid_at)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">Status</span>
            <Badge
              variant="secondary"
              className={receiptUtils.getStatusColor(td.payment_details.status)}
            >
              {td.payment_details.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleOpenPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!receipt.pdf_file}
          >
            <Download className="h-4 w-4" />
            View PDF
          </Button>
          
          <Button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={!receipt.pdf_file}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Generation Info */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          <p>Generated: {receiptUtils.formatDate(receipt.generated_at)}</p>
          {receipt.emailed_at && (
            <p>Emailed: {receiptUtils.formatDate(receipt.emailed_at)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptViewer;