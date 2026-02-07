import { 
  getPayments, 
  getLandlordPayments, 
  initializeMpesaPayment, 
  getMpesaPaymentStatus, 
  getMpesaConfigs,
  getCurrentRentPeriod
} from '../payments';
import apiClient from '@/lib/api/client';

// Mock the apiClient
jest.mock('@/lib/api/client', () => ({
  axios: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  __esModule: true,
  default: {
    axios: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  }
}));

const mockAxios = apiClient.axios as jest.Mocked<any>;

describe('Payments API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayments', () => {
    it('should fetch student payments and return data array', async () => {
      const mockData = [{ id: 1, amount: 100 }];
      mockAxios.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getPayments();

      expect(mockAxios.get).toHaveBeenCalledWith('/payments/history/', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('should return empty array on failure', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPayments();

      expect(result).toEqual([]);
    });
  });

  describe('getLandlordPayments', () => {
    it('should fetch landlord payments', async () => {
      const mockData = [{ id: 2, amount: 200 }];
      mockAxios.get.mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getLandlordPayments();

      expect(mockAxios.get).toHaveBeenCalledWith('/payments/transactions/landlord/', { params: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('initializeMpesaPayment', () => {
    it('should post initialization data and return response', async () => {
      const payload = { booking_id: '123', amount: 5000, phone_number: '254700000000' };
      const mockResponse = { transaction_id: 456, status: 'pending' };
      mockAxios.post.mockResolvedValueOnce({ data: { data: mockResponse } });

      const result = await initializeMpesaPayment(payload as any);

      expect(mockAxios.post).toHaveBeenCalledWith('/payments/mpesa/initialize/', {
        ...payload,
        booking_id: 123 // Verified parseInt transformation in code
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing data gracefully', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      const result = await initializeMpesaPayment({} as any);

      expect(result.status).toBe('failed');
      expect(result.message).toBe('Failed to initialize');
    });
  });

  describe('getMpesaPaymentStatus', () => {
    it('should fetch payment status by transaction ID', async () => {
      const mockResponse = { status: 'success', transaction: { id: 456 } };
      mockAxios.get.mockResolvedValueOnce({ data: { data: mockResponse } });

      const result = await getMpesaPaymentStatus({ transaction_id: '456' });

      expect(mockAxios.get).toHaveBeenCalledWith('/payments/mpesa/status/', {
        params: { transaction_id: '456' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMpesaConfigs', () => {
    it('should return list of configs', async () => {
      const mockConfigs = [{ id: 1, mpesa_number: '123456' }];
      mockAxios.get.mockResolvedValueOnce({ data: { data: { configs: mockConfigs } } });

      const result = await getMpesaConfigs();

      expect(result).toEqual(mockConfigs);
    });
  });

  describe('getCurrentRentPeriod', () => {
    it('should return current rent period', async () => {
      const mockPeriod = { id: 10, name: 'Jan 2024' };
      mockAxios.get.mockResolvedValueOnce({ data: { data: mockPeriod } });

      const result = await getCurrentRentPeriod();

      expect(mockAxios.get).toHaveBeenCalledWith('/payments/rent-periods/current/');
      expect(result).toEqual(mockPeriod);
    });

    it('should return null on failure', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('404'));

      const result = await getCurrentRentPeriod();

      expect(result).toBeNull();
    });
  });
});
