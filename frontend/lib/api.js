const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getApiUrl(path) {
  return `${API_BASE}/api${path}`;
}

export function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}
