import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Team from './pages/Team';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Hostels from './pages/Hostels';
import HostelDetail from './pages/HostelDetail';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/marketplace/ProductDetail';
import Wishlist from './pages/marketplace/Wishlist';
import Cart from './pages/marketplace/Cart';
import OrderHistory from './pages/marketplace/OrderHistory';
import Chat from './pages/marketplace/Chat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallback from './pages/auth/GoogleCallback';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import BrowseHostels from './pages/student/BrowseHostels';
import MyBookings from './pages/student/MyBookings';
import StudentAnalytics from './pages/student/StudentAnalytics';
import StudentSettings from './pages/student/StudentSettings';

// Landlord pages
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordProfile from './pages/landlord/LandlordProfile';
import ManageHostels from './pages/landlord/ManageHostels';
import SubscriptionManagement from './pages/landlord/SubscriptionManagement';
import PlanComparison from './pages/landlord/PlanComparison';

// Caretaker pages
import CaretakerDashboard from './pages/caretaker/CaretakerDashboard';
import InventoryManagement from './pages/caretaker/InventoryManagement';
import CheckInVerification from './pages/caretaker/CheckInVerification';

// Seller pages
import OrderManagement from './pages/seller/OrderManagement';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import LandlordVerification from './pages/admin/LandlordVerification';
import SellerApplicationReview from './pages/admin/SellerApplicationReview';

// Payment pages
import PaymentHistory from './pages/payments/PaymentHistory';
import ReceiptView from './pages/payments/ReceiptView';

// Shared pages
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              {/* Home and Info Pages */}
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="team" element={<Team />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />

              {/* Hostels */}
              <Route path="hostels" element={<Hostels />} />
              <Route path="hostels/:id" element={<HostelDetail />} />

              {/* Marketplace */}
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="marketplace/product/:id" element={<ProductDetail />} />

              {/* Authentication */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="auth/google/callback" element={<GoogleCallback />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Dashboard Routes - No Layout/Navbar/Footer */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard Routes */}
            <Route path="student">
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute role="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute role="student">
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hostels"
                element={
                  <ProtectedRoute role="student">
                    <BrowseHostels />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bookings"
                element={
                  <ProtectedRoute role="student">
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute role="student">
                    <StudentAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute role="student">
                    <StudentSettings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Landlord Dashboard Routes */}
            <Route path="landlord">
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute role="landlord">
                    <LandlordDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute role="landlord">
                    <LandlordProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hostels"
                element={
                  <ProtectedRoute role="landlord">
                    <ManageHostels />
                  </ProtectedRoute>
                }
              />
              <Route
                path="subscription"
                element={
                  <ProtectedRoute role="landlord">
                    <SubscriptionManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="plans"
                element={
                  <ProtectedRoute role="landlord">
                    <PlanComparison />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Caretaker Dashboard Routes */}
            <Route path="caretaker">
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute role="caretaker">
                    <CaretakerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute role="caretaker">
                    <InventoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkin"
                element={
                  <ProtectedRoute role="caretaker">
                    <CheckInVerification />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Seller Dashboard Routes */}
            <Route path="seller">
              <Route
                path="orders"
                element={
                  <ProtectedRoute>
                    <OrderManagement />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route path="admin">
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute role="super_admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute role="super_admin">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="landlord-verification"
                element={
                  <ProtectedRoute role="super_admin">
                    <LandlordVerification />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sellers"
                element={
                  <ProtectedRoute role="super_admin">
                    <SellerApplicationReview />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Protected Marketplace/Cart Routes */}
            <Route
              path="wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />

            {/* Protected Payment Routes */}
            <Route
              path="payments/history"
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments/receipt/:id"
              element={
                <ProtectedRoute>
                  <ReceiptView />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
