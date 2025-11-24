import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  UserIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [];
    
    // Student navigation
    if (user?.role === 'student') {
      baseItems.push(
        { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
        { name: 'Browse Hostels', href: '/student/hostels', icon: BuildingOfficeIcon },
        { name: 'My Bookings', href: '/student/bookings', icon: UserIcon },
        { name: 'Analytics', href: '/student/analytics', icon: ChartBarIcon },
        { name: 'Profile', href: '/student/profile', icon: UserIcon },
        { name: 'Settings', href: '/student/settings', icon: CogIcon }
      );
    }
    // Other roles can be added here
    else {
      baseItems.push(
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Hostels', href: '/hostels', icon: BuildingOfficeIcon },
        { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
        { name: 'Profile', href: '/profile', icon: UserIcon },
        { name: 'Settings', href: '/settings', icon: CogIcon }
      );
    }
    
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
    onToggle(); // Close sidebar on mobile after logout
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RUMI</span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && onToggle()} // Close on mobile
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group mb-1
                    ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`
                    w-5 h-5 mr-3 transition-colors duration-200
                    ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-600" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;