import {
  getPayments,
  getLandlordPayments,
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
