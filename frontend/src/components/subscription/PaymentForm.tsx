import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PaystackPayment from '../common/PaystackPayment';
import { CreditCard, Shield, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  planName: string;
  planId: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  className?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  planName,
  planId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = async (reference: string) => {
    setIsProcessing(true);
    try {
      // Here you might want to verify the payment with your backend
      // and then call the upgrade plan API
      onSuccess(reference);
    } catch (error) {
      console.error('Payment verification failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    if (!isProcessing) {
      onCancel();
    }
  };

  if (!user?.email) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600">User email is required for payment</p>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-semibold">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-lg">KES {amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Billing:</span>
            <span>Monthly</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Secure Payment</h4>
            <p className="text-sm text-blue-800">
              Your payment information is encrypted and processed securely through Paystack.
              We do not store your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Accepted Payment Methods
        </h4>
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
              VISA
            </div>
            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
              MC
            </div>
            <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
              M-PESA
            </div>
          </div>
        </div>
      </div>

      {/* Paystack Payment Component */}
      <PaystackPayment
        amount={amount}
        email={user.email}
        onSuccess={handlePaymentSuccess}
        onClose={handlePaymentClose}
        metadata={{
          plan_id: planId,
          plan_name: planName,
          payment_type: 'subscription_upgrade'
        }}
      />

      {/* Terms */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          By proceeding, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Cancel Button */}
      <div className="mt-4 text-center">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel and return to plans
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;