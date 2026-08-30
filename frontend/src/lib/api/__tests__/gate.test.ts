import { AxiosError } from 'axios';
import { isGateRejection } from '../gate';

function makeAxiosError(status: number, data: unknown): AxiosError {
  return Object.assign(new AxiosError(), {
    response: { status, data, statusText: '', headers: {}, config: {} },
  }) as AxiosError;
}

describe('isGateRejection', () => {
  it('returns null for a plain Error', () => {
    expect(isGateRejection(new Error('boom'))).toBeNull();
  });

  it('returns null for an AxiosError with status 400', () => {
    const err = makeAxiosError(400, { detail: 'Bad request' });
    expect(isGateRejection(err)).toBeNull();
  });

  it('returns null for an AxiosError with status 403 whose body has no gate key', () => {
    const err = makeAxiosError(403, { detail: 'Forbidden' });
    expect(isGateRejection(err)).toBeNull();
  });

  it('returns null for an AxiosError with status 403 whose gate value is unrecognized', () => {
    const err = makeAxiosError(403, { detail: 'Forbidden', gate: 'not_a_real_gate' });
    expect(isGateRejection(err)).toBeNull();
  });

  it('returns the parsed GateRejection for a valid gate-shaped 403', () => {
    const body = {
      detail: 'Unit limit reached for your plan.',
      gate: 'max_properties',
      current_tier: 'starter',
      required_tier: 'pro',
    };
    const err = makeAxiosError(403, body);
    expect(isGateRejection(err)).toEqual(body);
  });

  // Regression for CR-01 (03-REVIEW.md): the shared axios response
  // interceptor (client.ts) never rejects with a raw AxiosError — it
  // normalizes into `{ statusCode, details }` before callers see it.
  it('returns the parsed GateRejection for the normalized ApiError shape produced by client.ts', () => {
    const body = {
      detail: 'Caretaker seat limit reached for your plan.',
      gate: 'max_caretaker_seats',
      current_tier: 'starter',
      required_tier: 'pro',
    };
    const normalizedError = {
      error: 'api_error',
      message: body.detail,
      statusCode: 403,
      details: body,
    };
    expect(isGateRejection(normalizedError)).toEqual(body);
  });

  it('returns null for the normalized ApiError shape with a non-403 statusCode', () => {
    const normalizedError = {
      error: 'api_error',
      message: 'Bad request',
      statusCode: 400,
      details: { detail: 'Bad request' },
    };
    expect(isGateRejection(normalizedError)).toBeNull();
  });
});
