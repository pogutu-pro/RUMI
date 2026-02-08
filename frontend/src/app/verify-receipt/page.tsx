import { ReceiptVerification } from '@/features/payments/components/receipt-verification';

export default function VerifyReceiptPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rumia Receipt Verification</h1>
          <p className="mt-2 text-sm text-gray-600">
            Verify the authenticity of a payment receipt using the official Rumia verification system.
          </p>
        </div>
        
        <ReceiptVerification />
        
        <div className="text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Rumia. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
