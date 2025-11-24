import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [role, setRole] = useState<'student' | 'landlord'>(
    (searchParams.get('role') as 'student' | 'landlord') || 'student'
  );
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone_number: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [userId, setUserId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({
        ...formData,
        role
      });
      
      setUserId(response.user_id);
      setStep('verify');
      setSuccess('Registration successful! Please check your email for verification code.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
    
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'email profile openid',
      access_type: 'offline',
      state: role,
      prompt: 'consent'
    });
    
    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Check Your Email</h2>
            <p className="text-gray-600">We've sent a verification code to</p>
            <p className="font-semibold text-gray-900">{formData.email}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center">
              Please check your email and click the verification link or enter the 6-digit code to activate your account.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full text-center bg-primary-800 hover:bg-primary-900 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/images/register-bg.jpg" // Replace with your register background image
          alt="RUMI Platform Registration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-700 to-primary-800 opacity-90"></div>
        <div className="relative h-full flex items-center justify-center text-white p-12">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold mb-6">
              Join RUMI Today
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              {role === 'student' 
                ? 'Find your perfect room in minutes. Join thousands of happy students!'
                : 'Start managing your hostels professionally. 30-day free trial with all features!'
              }
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎁</span>
                </div>
                <span className="text-lg">
                  {role === 'student' ? 'No Booking Fees' : '30-Day Free Trial'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <span className="text-lg">Instant Access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <span className="text-lg">100% Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/images/logo/RUMI Logo.png"
              alt="RUMI Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <p className="text-gray-600">Create your account and get started</p>
          </div>

          {/* Role Selector */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                role === 'student'
                  ? 'bg-white text-primary-800 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('landlord')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                role === 'landlord'
                  ? 'bg-white text-secondary-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Landlord
            </button>
          </div>

          {/* Error/Success Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
          >
            <FcGoogle className="text-2xl" />
            <span className="font-medium text-gray-700">Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="+254712345678"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Format: +254XXXXXXXXX</p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Min 8 characters with uppercase, lowercase, number & special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="••••••••"
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

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500 mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-800 hover:text-secondary-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                role === 'student'
                  ? 'bg-primary-800 hover:bg-primary-900 text-white'
                  : 'bg-secondary-600 hover:bg-secondary-700 text-white'
              }`}
            >
              {isLoading ? 'Creating account...' : `Sign Up as ${role === 'student' ? 'Student' : 'Landlord'}`}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>

          {/* Trial Notice for Landlords */}
          {role === 'landlord' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 text-center">
                🎁 <strong>30-Day Free Trial</strong> - Full access to all features, no credit card required!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;