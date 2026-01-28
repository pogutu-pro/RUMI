export const saveRedirectUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('redirectAfterLogin', url);
  }
};

export const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('redirectAfterLogin');
  }
  return null;
};

export const clearRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('redirectAfterLogin');
  }
};

export const redirectToLogin = (currentUrl?: string) => {
  const url = currentUrl || window.location.pathname + window.location.search;
  saveRedirectUrl(url);
  window.location.href = `/login?redirect=${encodeURIComponent(url)}`;
};