import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import NotificationCenter from '../common/NotificationCenter';
import { HomeIcon, BuildingOfficeIcon, ShoppingBagIcon, HeartIcon, UserIcon, Bars3Icon, XMarkIcon, InformationCircleIcon, UsersIcon, PhoneIcon, QuestionMarkCircleIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'About', href: '/about', icon: InformationCircleIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Blog', href: '/blog', icon: DocumentTextIcon },
    { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
    { name: 'Contact', href: '/contact', icon: PhoneIcon },
    { name: 'Hostels', href: '/hostels', icon: BuildingOfficeIcon },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/images/logo/RUMI Logo.png"
                alt="RUMI Logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <NotificationCenter />

                {/* Wishlist Icon */}
                <Link
                  to="/wishlist"
                  className="relative flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                  title="Wishlist"
                >
                  <HeartIcon className="w-5 h-5" />
                  {wishlist && wishlist.total_items > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {wishlist.total_items > 99 ? '99+' : wishlist.total_items}
                    </span>
                  )}
                </Link>

                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="relative flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                  title="Shopping Cart"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  {cart && cart.total_items > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {cart.total_items > 99 ? '99+' : cart.total_items}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.first_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <HeartIcon className="w-5 h-5 mr-2" />
                    Wishlist
                    {wishlist && wishlist.total_items > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {wishlist.total_items > 99 ? '99+' : wishlist.total_items}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBagIcon className="w-5 h-5 mr-2" />
                    Cart
                    {cart && cart.total_items > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {cart.total_items > 99 ? '99+' : cart.total_items}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium btn-primary text-center mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;