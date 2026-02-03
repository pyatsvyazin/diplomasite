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

export async function submitRequest(data) {
  const url = getApiUrl('/request');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Не удалось отправить заявку');
  }
  return body;
}

export async function getAdminRequests(status = '') {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const url = getApiUrl('/admin/requests') + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить заявки');
  const data = await res.json();
  return data.data || [];
}

export async function updateAdminRequest(id, payload) {
  const url = getApiUrl(`/admin/requests/${id}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Не удалось обновить заявку');
  return body.data;
}

export async function getAdminLawyers(search = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const url = getApiUrl('/admin/lawyers') + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить юристов');
  const data = await res.json();
  return data.data || [];
}

export async function getMyRequests() {
  const url = getApiUrl('/requests/mine');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить заявки');
  const data = await res.json();
  return data.data || [];
}

export async function getAdminUsers(search = '', role = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  const url = getApiUrl('/admin/users') + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить пользователей');
  const data = await res.json();
  return data.users || [];
}