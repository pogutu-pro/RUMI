import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token');
        setVerifying(false);
        return;
      }

      try {
        await authAPI.verifyPasswordResetToken({ token });
        setTokenValid(true);
      } catch {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await authAPI.confirmPasswordReset({
        token,
        new_password: password,
        confirm_password: confirmPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-800 border-t-secondary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Invalid reset link
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-800 hover:bg-primary-900 text-white rounded-lg font-semibold transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Password reset successful!
            </h2>
            <p className="text-gray-600 mb-8">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-800 hover:bg-primary-900 text-white rounded-lg font-semibold transition-colors"
            >
              Go to login now
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          </div>
          <div className="relative h-full flex items-center justify-center text-white p-12">
            <div className="max-w-lg text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-bold mb-4">All Set!</h3>
              <p className="text-xl text-gray-200">
                Your password has been successfully reset. You can now login with your new password.
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
              Create new password
            </h2>
            <p className="text-gray-600">
              Enter your new password below
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
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Password must:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  Be at least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${password === confirmPassword && password ? 'text-green-600' : 'text-gray-400'}`} />
                  Match in both fields
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-800 hover:text-secondary-600 font-medium transition-colors">
              Back to login
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
            <h3 className="text-4xl font-bold mb-6">Secure Password Reset</h3>
            <p className="text-xl text-gray-200 mb-8">
              Create a strong password to protect your RUMI account and keep your data secure.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-lg">Encrypted & Protected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-lg">Industry-Standard Security</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✓</span>
                </div>
                <span className="text-lg">Instant Access After Reset</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;