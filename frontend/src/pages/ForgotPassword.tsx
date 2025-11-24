import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.requestPasswordReset({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Check your email
              </h2>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to
              </p>
              <p className="text-primary-800 font-semibold mb-6">{email}</p>
              <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-8">
                <p className="text-sm text-gray-700">
                  Please check your inbox and follow the instructions to reset your password.
                  The link will expire in 24 hours.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary-800 hover:text-secondary-600 font-semibold transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Return to login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          </div>
          <div className="relative h-full flex items-center justify-center text-white p-12">
            <div className="max-w-lg text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Email Sent!</h3>
              <p className="text-xl text-gray-200">
                Check your inbox for the password reset link.
                It should arrive within a few minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/images/logo/RUMI Logo.png"
              alt="RUMI Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset your password
            </h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/login" className="text-primary-800 hover:text-secondary-600 font-medium transition-colors">
              Back to login
            </Link>
            <Link to="/register" className="text-primary-800 hover:text-secondary-600 font-medium transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-white p-12">
          <div className="max-w-lg">
            <h3 className="text-4xl font-bold mb-6">Forgot Your Password?</h3>
            <p className="text-xl text-gray-200 mb-8">
              No worries! It happens to the best of us. Enter your email and we'll send you a secure link to reset it.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <span className="text-lg">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <span className="text-lg">Quick Process</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✓</span>
                </div>
                <span className="text-lg">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;