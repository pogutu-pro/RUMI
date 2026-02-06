/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import { deriveRentStatus } from '../data-derivation';
import { addDays, subDays, formatISO } from 'date-fns';

describe('Data Derivation Utilities', () => {
  const mockPlan = { id: 1, name: 'Basic', price: 5000 };
  
  describe('deriveRentStatus', () => {
    it('should return default values if subscription is null', () => {
      const result = deriveRentStatus(null);
      expect(result.status).toBe('pending');
      expect(result.totalOutstanding).toBe(0);
    });

    it('should show "paid" for active subscription with distant end date', () => {
      const futureDate = addDays(new Date(), 30);
      const subscription: any = {
        status: 'active',
        startDate: formatISO(new Date()),
        endDate: formatISO(futureDate),
        plan: mockPlan
      };
      
      const result = deriveRentStatus(subscription);
      expect(result.status).toBe('paid');
      expect(result.totalOutstanding).toBe(0);
    });

    it('should show "pending" if subscription expires within 7 days', () => {
      const soonDate = addDays(new Date(), 5);
      const subscription: any = {
        status: 'active',
        endDate: formatISO(soonDate),
        plan: mockPlan
      };
      
      const result = deriveRentStatus(subscription);
      expect(result.status).toBe('pending');
      expect(result.totalOutstanding).toBe(5000);
    });

    it('should show "overdue" if end date has passed', () => {
      const pastDate = subDays(new Date(), 2);
      const subscription: any = {
        status: 'active',
        endDate: formatISO(pastDate),
        plan: mockPlan
      };
      
      const result = deriveRentStatus(subscription);
      expect(result.status).toBe('overdue');
      expect(result.totalOutstanding).toBe(5000);
    });

    it('should show "pending" if subscription status is cancelled', () => {
      const subscription: any = {
        status: 'cancelled',
        endDate: formatISO(addDays(new Date(), 30)),
        plan: mockPlan
      };
      
      const result = deriveRentStatus(subscription);
      expect(result.status).toBe('pending');
    });
  });
});
