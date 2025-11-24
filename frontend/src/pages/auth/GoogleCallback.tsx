import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // role
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google authentication was cancelled or failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setError('Invalid authentication response');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        await loginWithGoogle(code, state);
        
        // Redirect based on role
        if (state === 'student') {
          navigate('/student/dashboard');
        } else if (state === 'landlord') {
          navigate('/landlord/dashboard');
        } else {
          navigate('/');
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h2>
            <p className="text-gray-600">Please wait while we sign you in with Google</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;