import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiErrorResponse {
  errors: ApiError[];
  message: string;
  statusCode: number;
}

export const API_ERROR_MESSAGES: Record<string, string> = {
  email_exists: 'This email is already registered.',
  phone_exists: 'This phone number is already registered.',
  validation_error: 'Some fields contain invalid data.',
  network_error: 'Network error. Please check your connection.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

function mapKnownErrorCode(code?: string): string | undefined {
  if (!code) return;
  return API_ERROR_MESSAGES[code];
}

export function mapApiError(error: unknown): ApiErrorResponse {
  // 1. Handle nothing
  if (!error) {
    return {
      errors: [{ message: API_ERROR_MESSAGES.unknown }],
      message: API_ERROR_MESSAGES.unknown,
      statusCode: 500,
    };
  }

  // 2. Axios Error (HTTP, network, timeout)
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const data = error.response?.data;

    //  Handle timeouts
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        errors: [{ message: API_ERROR_MESSAGES.timeout }],
        message: API_ERROR_MESSAGES.timeout,
        statusCode: 408,
      };
    }

    //  No response = network error
    if (!error.response) {
      return {
        errors: [{ message: API_ERROR_MESSAGES.network_error }],
        message: API_ERROR_MESSAGES.network_error,
        statusCode: 0,
      };
    }

    //  Django REST Framework formatted errors
    if (data && typeof data === 'object') {
      const parsedErrors: ApiError[] = [];

      Object.entries(data).forEach(([key, value]) => {
        const field =
          key === 'non_field_errors' || key === 'detail' ? undefined : key;

        if (Array.isArray(value)) {
          value.forEach((msg) => {
            parsedErrors.push({
              field,
              message: typeof msg === 'string' ? msg : JSON.stringify(msg),
            });
          });
        } else if (typeof value === 'string') {
          parsedErrors.push({
            field,
            message: value,
          });
        } else {
          parsedErrors.push({
            field,
            message: JSON.stringify(value),
          });
        }
      });

      const mainMessage =
        mapKnownErrorCode(data.code) ||
        parsedErrors[0]?.message ||
        API_ERROR_MESSAGES.unknown;

      return {
        errors: parsedErrors.length ? parsedErrors : [{ message: mainMessage }],
        message: mainMessage,
        statusCode: status,
      };
    }

    //  Fallback generic HTTP error
    return {
      errors: [{ message: error.message || API_ERROR_MESSAGES.unknown }],
      message: error.message || API_ERROR_MESSAGES.unknown,
      statusCode: status,
    };
  }

  if (error instanceof Error) {
    return {
      errors: [{ message: error.message }],
      message: error.message,
      statusCode: 500,
    };
  }

  // 4. Unknown fallback
  return {
    errors: [{ message: API_ERROR_MESSAGES.unknown }],
    message: API_ERROR_MESSAGES.unknown,
    statusCode: 500,
  };
}

export function mapApiMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  const payload = mapApiError(error);
  return payload.message;
}

export function getFieldError(
  errors: ApiError[],
  field: string,
): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function getNonFieldErrors(errors: ApiError[]): string[] {
  return errors.filter((e) => !e.field).map((e) => e.message);
}

/**
 * ================================================================================
 * README: Error Mapping Utility (error-mapping.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Transforms raw API/Axios errors into standardized, user-friendly error objects.
 * Used throughout the app to provide consistent error handling.
 *
 * FUNCTIONS:
 * ----------
 * | Function           | Description                              |
 * |-------------------|------------------------------------------|
 * | mapApiError()     | Converts any error to ApiErrorResponse   |
 * | mapApiMessage()   | Extracts just the main error message     |
 * | getFieldError()   | Gets error for a specific form field     |
 * | getNonFieldErrors()| Gets all errors not tied to fields      |
 *
 * ERROR HANDLING:
 * ---------------
 * - Timeout: ECONNABORTED → "Request timed out..."
 * - Network: No response → "Network error..."
 * - Django REST: Parses field-level errors from DRF format
 * - Generic: Falls back to error.message
 *
 * KNOWN ERROR CODES:
 * ------------------
 * email_exists, phone_exists, validation_error, network_error, timeout
 *
 * USAGE:
 * ------
 * ```typescript
 * import { mapApiError, getFieldError } from './error-mapping';
 *
 * try {
 *   await api.post('/register/', data);
 * } catch (err) {
 *   const { errors, message } = mapApiError(err);
 *   const emailError = getFieldError(errors, 'email');
 *   toast.error(message);
 * }
 * ```
 *
 * ================================================================================
 */

