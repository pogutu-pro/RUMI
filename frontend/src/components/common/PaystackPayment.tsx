import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

interface PaystackPaymentProps {
  amount: number; // Amount in KES
  email: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  metadata?: Record<string, any>;
  className?: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  amount,
  email,
  onSuccess,
  onClose,
  metadata = {},
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Paystack script if not already loaded
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const initializePayment = async () => {
    if (!window.PaystackPop) {
      setError('Payment system is loading. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize payment with backend
      const response = await paymentAPI.initializePayment({
        amount: Math.round(amount * 100), // Convert to kobo
        email,
        currency: 'KES',
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: metadata.payment_type || 'general'
            }
          ]
        }
      });

      const { authorization_url, reference } = response.data;

      // Open Paystack popup
      const popup = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amount * 100),
        currency: 'KES',
        ref: reference,
        metadata,
        callback: (response: any) => {
          // Payment successful
          onSuccess(response.reference);
        },
        onClose: () => {
          onClose();
        }
      });

      popup.openIframe();
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={initializePayment}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color="text-white" />
            <span>Initializing Payment...</span>
          </>
        ) : (
          <>
            <span>Pay KSh {amount.toLocaleString()}</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>

      <div className="text-center text-sm text-gray-600">
        <p>Secure payment powered by Paystack</p>
        <div className="flex justify-center items-center space-x-2 mt-2">
          <div className="flex space-x-1">
            {['visa', 'mastercard', 'mpesa'].map((method) => (
              <div key={method} className="w-8 h-5 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-600">
                {method === 'mpesa' ? 'MP' : method.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackPayment;