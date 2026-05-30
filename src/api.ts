// Prefer explicit env var; fall back to localhost backend for developer convenience
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export const apiFetch = (path: string, init?: RequestInit) => {
  return fetch(apiUrl(path), init);
};