// Analytics API Service for RUMI Platform
import api from './api';

// Revenue Analytics
export const getRevenueAnalytics = (params?: { start_date?: string; end_date?: string }) =>
  api.get('/payments/analytics/revenue/', { params });

// User Analytics
export const getUserAnalytics = (params?: { start_date?: string; end_date?: string }) =>
  api.get('/accounts/analytics/users/', { params });

// Product Analytics
export const getProductAnalytics = (params?: { start_date?: string; end_date?: string }) =>
  api.get('/marketplace/analytics/products/', { params });

export const analyticsAPI = {
  getRevenueAnalytics,
  getUserAnalytics,
  getProductAnalytics,
};

export default analyticsAPI;