import { useEffect, useRef } from 'react';

export function useMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

export function useOnMount(fn: () => void) {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fn();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fn]);
}

export function useOnUnmount(fn: () => void) {
  useEffect(() => {
    return () => {
      fn();
    };
  }, [fn]);
}
