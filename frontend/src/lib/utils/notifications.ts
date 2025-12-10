import { toast } from 'sonner';

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};


 

export function notifySuccess(message: string, options?: ToastOptions): void {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  });
}


 

export function notifyError(message: string, options?: ToastOptions): void {
  toast.error(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  });
}


 

export function notifyInfo(message: string, options?: ToastOptions): void {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  });
}



export function notifyWarning(message: string, options?: ToastOptions): void {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  });
}




export function notifyLoading(message: string): string | number {
  return toast.loading(message);
}


 

export function dismissNotification(toastId: string | number): void {
  toast.dismiss(toastId);
}



export function dismissAllNotifications(): void {
  toast.dismiss();
}


export function notifyPromise<T>( 
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  return toast.promise(promise, messages);
}

export const notifications = {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  warning: notifyWarning,
  loading: notifyLoading,
  dismiss: dismissNotification,
  dismissAll: dismissAllNotifications,
  promise: notifyPromise,
};
