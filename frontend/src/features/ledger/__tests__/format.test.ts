import { apiErrorMessage, formatKes } from '../lib/format';

describe('formatKes', () => {
  it('formats whole shillings by default and cents on request', () => {
    expect(formatKes('22000.00')).toBe('KES 22,000');
    expect(formatKes('10645.16', { cents: true })).toBe('KES 10,645.16');
    expect(formatKes(undefined)).toBe('KES 0');
  });
});

describe('apiErrorMessage', () => {
  it('prefers the normalized message', () => {
    expect(apiErrorMessage({ message: 'Credit note of 5 exceeds the unpaid balance' }, 'x')).toBe(
      'Credit note of 5 exceeds the unpaid balance',
    );
  });

  it('falls back to the first DRF field error wrapped in errors', () => {
    const err = {
      message: 'An error occurred',
      details: { detail: '', code: '400', errors: { amount: ['Amount exceeds the outstanding balance.'] } },
    };
    expect(apiErrorMessage(err, 'fallback')).toBe('Amount exceeds the outstanding balance.');
  });

  it('reads a plain field map and finally the fallback', () => {
    expect(apiErrorMessage({ details: { reason: 'A reason is required.' } }, 'x')).toBe('A reason is required.');
    expect(apiErrorMessage(undefined, 'Could not save')).toBe('Could not save');
  });
});
