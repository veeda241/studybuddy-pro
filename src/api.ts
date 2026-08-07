// In development, leave unset to use CRA proxy ("proxy" in package.json).
// In production, set REACT_APP_API_URL to your deployed backend.
const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers || {});

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Do not attach stale tokens to auth endpoints
  const isAuthRoute = path.includes('/api/login') || path.includes('/api/register') || path.includes('/api/auth/');
  const token = localStorage.getItem('token');
  if (token && !isAuthRoute && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
};
