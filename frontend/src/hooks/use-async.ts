import { useState, useCallback, useReducer, useRef } from 'react';
import { logger } from '@/lib/logger';

// State machine states
type AsyncStatus = 'idle' | 'pending' | 'resolved' | 'rejected';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
}

type AsyncAction<T> =
  | { type: 'pending' }
  | { type: 'resolved'; data: T }
  | { type: 'rejected'; error: Error }
  | { type: 'reset' };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'pending': {
      return {
        status: 'pending',
        data: null,
        error: null,
      };
    }
    case 'resolved': {
      return {
        status: 'resolved',
        data: action.data,
        error: null,
      };
    }
    case 'rejected': {
      return {
        status: 'rejected',
        data: null,
        error: action.error,
      };
    }
    case 'reset': {
      return {
        status: 'idle',
        data: null,
        error: null,
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  }
}

// Hook configuration options
interface UseAsyncOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T = any>(initialState?: Partial<AsyncState<T>>, options?: UseAsyncOptions<T>) {
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    status: 'idle',
    data: null,
    error: null,
    ...initialState,
  });

  const setData = useCallback((data: T) => dispatch({ type: 'resolved', data }), []);
  const setError = useCallback((error: Error) => dispatch({ type: 'rejected', error }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  // Use refs to keep callbacks fresh without triggering re-renders in run()
  const successCallbackRef = useRef(options?.onSuccess);
  const errorCallbackRef = useRef(options?.onError);

  // Update refs when options change
  successCallbackRef.current = options?.onSuccess;
  errorCallbackRef.current = options?.onError;

  const run = useCallback(
    (promise: Promise<T>) => {
      if (!promise || !promise.then) {
        const error = new Error('The argument passed to useAsync().run must be a promise.');
        logger.error('useAsync run error', error);
        return Promise.reject(error);
      }

      dispatch({ type: 'pending' });

      return promise
        .then((data) => {
          setData(data);
          successCallbackRef.current?.(data);
          return data;
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          setError(err);
          logger.error('Async operation failed', err);
          errorCallbackRef.current?.(err);
          return Promise.reject(err);
        });
    },
    [setData, setError]
  );

  return {
    isIdle: state.status === 'idle',
    isLoading: state.status === 'pending',
    isError: state.status === 'rejected',
    isSuccess: state.status === 'resolved',
    
    setData,
    setError,
    run,
    reset,
    
    status: state.status,
    data: state.data,
    error: state.error,
  };
}
