import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Receipt, CreditCard, Calendar, Hash } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';

interface ReceiptData {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
  payment_method?: string;
  reference: string;
  receipt_number: string;
  customer_details: {
    name: string;
    email: string;
  };
  merchant_details: {
    name: string;
    address?: string;
  };
}

const ReceiptView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTransactionReceipt } = usePayments();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(true);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!id) return;

      try {
        setLoadingReceipt(true);
        await getTransactionReceipt(id);
        // In a real app, the API would return receipt data
        // For now, we'll simulate receipt data based on transaction
        setReceiptData({
          id: id,
          transaction_id: id,
          amount: 2500, // This would come from the API
          currency: 'KES',
          status: 'completed',
          description: 'Subscription Payment - Basic Plan',
          created_at: new Date().toISOString(),
          payment_method: 'M-Pesa',
          reference: 'TXN-123456789',
          receipt_number: `RCP-${id}`,
          customer_details: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          merchant_details: {
            name: 'RUMI Platform',
            address: 'Nairobi, Kenya',
          },
        });
      } catch (err) {
        console.error('Error loading receipt:', err);
      } finally {
        setLoadingReceipt(false);
      }
    };

    loadReceipt();
  }, [id, getTransactionReceipt]);

  const handleDownload = () => {
    // In a real app, this would trigger a download
    alert('Download functionality would be implemented here');
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingReceipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Receipt Not Found</h2>
          <p className="text-gray-600 mb-6">The receipt you're looking for could not be loaded.</p>
          <button
            onClick={() => navigate('/payments/history')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Payment History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/payments/history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Payment History
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Receipt</h1>
              <p className="text-gray-600">Receipt #{receiptData.receipt_number}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{receiptData.merchant_details.name}</h2>
              {receiptData.merchant_details.address && (
                <p className="text-blue-100">{receiptData.merchant_details.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Receipt Number</p>
              <p className="text-xl font-bold">{receiptData.receipt_number}</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6">
          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-medium">{receiptData.transaction_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">{formatDate(receiptData.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{receiptData.payment_method || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{receiptData.customer_details.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{receiptData.customer_details.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                receiptData.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {receiptData.status.charAt(0).toUpperCase() + receiptData.status.slice(1)}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{receiptData.description}</p>
                  <p className="text-sm text-gray-600">Reference: {receiptData.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(receiptData.amount, receiptData.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 mt-6">
            <div className="text-center text-sm text-gray-600">
              <p>Thank you for your business!</p>
              <p className="mt-1">This is an electronically generated receipt.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;