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

export async function requestPasswordReset(email) {
  const url = getApiUrl('/forgot-password');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось отправить запрос');
  return data;
}

export async function resetPasswordWithToken(payload) {
  const url = getApiUrl('/reset-password');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось сменить пароль');
  return data;
}

export async function verify2fa(pending2faId, code) {
  const url = getApiUrl('/verify-2fa');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pending_2fa_id: pending2faId, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Неверный код');
  return data;
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

export async function getAdminStaff() {
  const url = getApiUrl('/admin/staff');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить сотрудников');
  const data = await res.json();
  return data.data || [];
}

export async function updateAdminStaffMember(id, payload) {
  const url = getApiUrl(`/admin/staff/${id}`);
  const isFormData = payload instanceof FormData;
  const headers = { ...getAuthHeaders() };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const method = isFormData ? 'POST' : 'PATCH';
  const body = isFormData ? payload : JSON.stringify(payload);
  if (isFormData) {
    payload.append('_method', 'PATCH');
  }
  const res = await fetch(url, {
    method,
    headers,
    body,
  });
  const bodyRes = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(bodyRes.message || 'Не удалось обновить данные');
  return bodyRes.data;
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

export async function updateAdminUserBlock(userId, isBlocked) {
  const url = getApiUrl(`/admin/users/${userId}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ is_blocked: isBlocked }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось обновить пользователя');
  return data.user;
}

export async function getReviews() {
  const url = getApiUrl('/reviews');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить отзывы');
  const data = await res.json();
  return data.data || [];
}

export async function createReview(payload) {
  const url = getApiUrl('/reviews');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Не удалось отправить отзыв');
  return body.data;
}

export async function updateCurrentUser(payload) {
  const url = getApiUrl('/user');
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Не удалось обновить профиль');
  return body;
}

export async function requestPasswordChangeCode() {
  const url = getApiUrl('/user/request-password-change');
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось отправить код');
  return data;
}

export async function confirmPasswordChange(payload) {
  const url = getApiUrl('/user/confirm-password-change');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось сменить пароль');
  return data;
}

const PLACEHOLDER_AVATAR = '/images/avatars/placeholder_avatar.png';

export function getAvatarUrl(userOrPath) {
  const path = typeof userOrPath === 'object' ? userOrPath?.avatar_path : userOrPath;
  if (!path) return PLACEHOLDER_AVATAR;
  if (path.startsWith('http')) return path;
  // путь вида /images/... — это фронт (заглушка), отдаём как есть
  if (path.startsWith('/images/')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return base + '/storage/' + path.replace(/^\/+/, '');
}