// API Service for RUMI Platform
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await api.post('/accounts/refresh-token/', {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Enhanced error handling for different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);

      // Handle specific error codes
      switch (status) {
        case 400:
          throw new Error(data.detail || data.message || 'Bad request. Please check your input.');
        case 403:
          throw new Error('You do not have permission to perform this action.');
        case 404:
          throw new Error('The requested resource was not found.');
        case 422:
          throw new Error(data.detail || 'Validation error. Please check your input.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(data.detail || data.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      throw new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      console.error('Request error:', error);
      throw new Error('An unexpected error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/accounts/login/', credentials),

  register: (userData: {
    email: string;
    password: string;
    confirm_password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  }) =>
    api.post('/accounts/register/', userData),

  verifyEmail: (data: { email: string; otp_code: string }) =>
    api.post('/accounts/verify-email/', data),

  resendOTP: (data: { email: string; verification_type?: string }) =>
    api.post('/accounts/resend-otp/', data),

  refreshToken: (refreshToken: string) =>
    api.post('/accounts/refresh-token/', { refresh_token: refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/accounts/logout/', { refresh_token: refreshToken }),

  getProfile: () =>
    api.get('/accounts/profile/'),

  updateProfile: (data: Record<string, any>) =>
    api.put('/accounts/profile/', data),

  uploadProfilePicture: (formData: FormData) =>
    api.post('/accounts/profile/picture/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Password reset
  requestPasswordReset: (data: { email: string }) =>
    api.post('/accounts/password/reset/', data),

  verifyPasswordResetToken: (data: { token: string }) =>
    api.post('/accounts/password/reset/verify/', data),

  confirmPasswordReset: (data: { token: string; new_password: string; confirm_password: string }) =>
    api.post('/accounts/password/reset/confirm/', data),

  // Dashboard
  getDashboard: () =>
    api.get('/accounts/dashboard/'),

  // Admin APIs
  getUsers: (params?: Record<string, any>) =>
    api.get('/accounts/admin/users/', { params }),

  getAdminStats: () =>
    api.get('/accounts/admin/stats/'),

  getLandlordVerifications: (params?: Record<string, any>) =>
    api.get('/accounts/admin/landlord-verifications/', { params }),

  verifyLandlordApplication: (applicationId: number, data: { status: 'approved' | 'rejected'; comments?: string }) =>
    api.post(`/accounts/admin/landlord-verifications/${applicationId}/verify/`, data),

  deactivateUser: (userId: number, data: Record<string, any>) =>
    api.post(`/accounts/admin/users/${userId}/deactivate/`, data),

  reactivateUser: (userId: number) =>
    api.post(`/accounts/admin/users/${userId}/reactivate/`),
};

// Hostel APIs
export const hostelAPI = {
  // Hostel listing and search
  getHostels: (params?: Record<string, any>) =>
    api.get('/hostels/', { params }),

  // Hostel management (Landlord)
  createHostel: (hostelData: Record<string, any>) =>
    api.post('/hostels/create/', hostelData),

  getHostel: (hostelId: string) =>
    api.get(`/hostels/${hostelId}/`),

  // Room management
  createRoom: (hostelId: string, roomData: Record<string, any>) =>
    api.post(`/hostels/${hostelId}/rooms/`, roomData),

  // Inventory management
  createInventoryTemplate: (hostelId: string, templateData: Record<string, any>) =>
    api.post(`/hostels/${hostelId}/inventory/`, templateData),

  getInventoryTemplate: (hostelId: string) =>
    api.get(`/hostels/${hostelId}/inventory/template/`),

  // Check-in process
  startInventoryCheckIn: (bookingId: string) =>
    api.post(`/hostels/checkin/${bookingId}/start/`),

  submitInventoryCheckIn: (checkinId: string, checklistData: Record<string, any>) =>
    api.put(`/hostels/checkin/${checkinId}/submit/`, { checklist_data: checklistData }),

  verifyInventoryCheckIn: (checkinId: string, verificationData: Record<string, any>) =>
    api.put(`/hostels/checkin/${checkinId}/verify/`, verificationData),

  // Room search and booking
  searchRooms: (params?: Record<string, any>) =>
    api.get('/hostels/search/', { params }),

  reserveRoom: (roomId: string, reservationData: Record<string, any>) =>
    api.post(`/hostels/${roomId}/reserve/`, reservationData),

  bookRoom: (roomId: string, bookingData: Record<string, any>) =>
    api.post(`/hostels/${roomId}/book/`, bookingData),

  // Roommate matching
  getRoommateMatches: (roomId: string) =>
    api.get(`/hostels/${roomId}/roommates/`),
};

// Marketplace APIs
export const marketplaceAPI = {
  // Seller applications
  submitSellerApplication: (applicationData: Record<string, any>) =>
    api.post('/marketplace/seller/apply/', applicationData),

  getSellerApplicationStatus: (applicationId: string) =>
    api.get(`/marketplace/seller/application/${applicationId}/`),

  // Admin seller management
  getSellerApplications: (params?: Record<string, any>) =>
    api.get('/marketplace/admin/seller-applications/', { params }),

  reviewSellerApplication: (applicationId: string) =>
    api.put(`/marketplace/admin/seller-applications/${applicationId}/review/`),

  approveSellerApplication: (applicationId: string, approvalData: Record<string, any>) =>
    api.post(`/marketplace/admin/seller-applications/${applicationId}/approve/`, approvalData),

  rejectSellerApplication: (applicationId: string, rejectionData: Record<string, any>) =>
    api.post(`/marketplace/admin/seller-applications/${applicationId}/reject/`, rejectionData),

  getSellers: () =>
    api.get('/marketplace/admin/sellers/'),

  // Products
  getProducts: (params?: Record<string, any>) =>
    api.get('/marketplace/products/', { params }),

  createProduct: (productData: Record<string, any>) =>
    api.post('/marketplace/products/create/', productData),

  revealContact: (productId: string) =>
    api.post(`/marketplace/products/${productId}/contact/`),

  // Cart
  getCart: () =>
    api.get('/marketplace/cart/'),

  addToCart: (data: { product_id: number; quantity: number }) =>
    api.post('/marketplace/cart/add/', data),

  updateCartItem: (itemId: number, data: { quantity: number }) =>
    api.put(`/marketplace/cart/update/`, { item_id: itemId, ...data }),

  removeCartItem: (itemId: number) =>
    api.delete(`/marketplace/cart/remove/${itemId}/`),

  // Orders
  getOrders: (params?: Record<string, any>) =>
    api.get('/marketplace/orders/', { params }),

  getOrderDetails: (orderId: string) =>
    api.get(`/marketplace/orders/${orderId}/`),

  updateOrderStatus: (orderId: string, status: string) =>
    api.put(`/marketplace/orders/${orderId}/status/`, { status }),

  markOrderShipped: (orderId: string) =>
    api.post(`/marketplace/orders/${orderId}/ship/`),

  markOrderDelivered: (orderId: string) =>
    api.post(`/marketplace/orders/${orderId}/deliver/`),

  // Reviews
  getProductReviews: (productId: string, params?: Record<string, any>) =>
    api.get(`/marketplace/products/${productId}/reviews/`, { params }),

  submitReview: (orderId: string, reviewData: Record<string, any>) =>
    api.post(`/marketplace/orders/${orderId}/review/`, reviewData),

  // Wishlist
  getWishlist: () =>
    api.get('/marketplace/wishlist/'),

  addToWishlist: (data: { product_id: number }) =>
    api.post('/marketplace/wishlist/add/', data),

  removeFromWishlist: (itemId: number) =>
    api.delete(`/marketplace/wishlist/remove/${itemId}/`),

  // Chat
  getConversations: () =>
    api.get('/marketplace/chat/conversations/'),

  getConversationMessages: (conversationId: string) =>
    api.get(`/marketplace/chat/conversations/${conversationId}/messages/`),

  sendMessage: (conversationId: string, messageData: { message: string }) =>
    api.post(`/marketplace/chat/conversations/${conversationId}/messages/`, messageData),
};

// Payments APIs
export const paymentAPI = {
  initializePayment: (paymentData: Record<string, any>) =>
    api.post('/payments/initialize/', paymentData),

  enableRecurringPayment: (recurringData: Record<string, any>) =>
    api.post('/payments/recurring/enable/', recurringData),

  pauseRecurringPayment: (recurringId: string) =>
    api.put(`/payments/recurring/${recurringId}/pause/`),

  resumeRecurringPayment: (recurringId: string) =>
    api.put(`/payments/recurring/${recurringId}/resume/`),

  cancelRecurringPayment: (recurringId: string) =>
    api.delete(`/payments/recurring/${recurringId}/cancel/`),

  getLateFees: (bookingId: string) =>
    api.get(`/payments/late-fees/${bookingId}/`),

  payLateFee: (lateFeeId: string) =>
    api.post(`/payments/late-fees/${lateFeeId}/pay/`),

  getSavedPaymentMethods: () =>
    api.get('/payments/payment-methods/'),

  setDefaultPaymentMethod: (methodId: string) =>
    api.put(`/payments/payment-methods/${methodId}/default/`),

  deletePaymentMethod: (methodId: string) =>
    api.delete(`/payments/payment-methods/${methodId}/`),

  getPaymentReceipt: (transactionId: string) =>
    api.get(`/payments/receipts/${transactionId}/`),

  getTaxReports: () =>
    api.get('/payments/tax-reports/'),

  downloadTaxReport: (reportId: string) =>
    api.get(`/payments/tax-reports/${reportId}/download/`),

  getRevenueAnalytics: (params?: Record<string, any>) =>
    api.get('/payments/analytics/revenue/', { params }),

  // Payment History APIs
  getTransactions: (params?: Record<string, any>) =>
    api.get('/payments/transactions/', { params }),

  getTransactionReceipt: (transactionId: string) =>
    api.get(`/payments/transactions/${transactionId}/receipt/`),

  getRecurringPayments: (params?: Record<string, any>) =>
    api.get('/payments/recurring/', { params }),
};

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () =>
    api.get('/accounts/subscriptions/plans/'),

  getMySubscription: () =>
    api.get('/accounts/subscriptions/my-subscription/'),

  upgradePlan: (data: { new_plan_id: string; immediate?: boolean }) =>
    api.post('/accounts/subscriptions/upgrade/', data),

  cancelSubscription: (data: { reason: string; immediate?: boolean }) =>
    api.post('/accounts/subscriptions/cancel/', data),

  reactivateSubscription: () =>
    api.post('/accounts/subscriptions/reactivate/'),
};

// Notifications APIs
export const notificationAPI = {
  getNotifications: (params?: Record<string, any>) =>
    api.get('/notifications/', { params }),

  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read/`),

  markAllAsRead: () =>
    api.put('/notifications/mark-all-read/'),

  getPreferences: () =>
    api.get('/notifications/preferences/'),

  updatePreferences: (preferences: Record<string, any>) =>
    api.put('/notifications/preferences/', preferences),
};

export default api;