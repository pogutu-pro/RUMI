import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'landlord' | 'caretaker' | 'tech_support' | 'super_admin';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardMap: Record<string, string> = {
      student: '/student/dashboard',
      landlord: '/landlord/subscription',
      caretaker: '/caretaker/dashboard',
      tech_support: '/admin/dashboard',
      super_admin: '/admin/dashboard'
    };

    return <Navigate to={dashboardMap[user?.role || ''] || '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;