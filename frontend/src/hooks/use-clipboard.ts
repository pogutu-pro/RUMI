import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseClipboardOptions {
  timeout?: number; // Time in ms before resetting copied state
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for copying text to clipboard
 * @param options - Configuration options
 * @returns Object with copy function and state
 */
export const useClipboard = (options: UseClipboardOptions = {}) => {
  const {
    timeout = 2000,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy to clipboard',
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        const err = new Error('Clipboard API not available');
        setError(err);
        toast.error(errorMessage);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        toast.success(successMessage);

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Copy failed');
        setError(error);
        setCopied(false);
        toast.error(errorMessage);
        return false;
      }
    },
    [timeout, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return {
    copy,
    copied,
    error,
    reset,
  };
};
