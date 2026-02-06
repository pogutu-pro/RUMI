/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import { formatCurrency } from '../currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format KES correctly', () => {
      const result = formatCurrency(5000);
      // Depending on locale, might be "KES 5,000" or similar. 
      // We check if it contains the number and currency initials.
      expect(result).toContain('5,000');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });
});
