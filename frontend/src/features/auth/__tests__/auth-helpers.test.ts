import { safeNextPath } from '../hooks/use-auth';
import { normalizeKenyanPhone } from '../components/landlord-onboarding-wizard';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

describe('safeNextPath', () => {
  it.each([
    ['/landlord/rental/payments', '/landlord/rental/payments'],
    ['/tenant/rental?tab=pay', '/tenant/rental?tab=pay'],
    ['//evil.example', null],
    ['https://evil.example', null],
    ['/login', null],
    ['/auth/link?token=x', null],
    ['', null],
    [null, null],
  ])('%s -> %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe('normalizeKenyanPhone', () => {
  it.each([
    ['0712 345 678', '+254712345678'],
    ['+254712345678', '+254712345678'],
    ['254112345678', '+254112345678'],
    ['712345678', '+254712345678'],
    ['0612345678', null],
    ['12345', null],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeKenyanPhone(input)).toBe(expected);
  });
});
