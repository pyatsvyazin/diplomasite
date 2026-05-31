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

export async function verifyEmail(token, email) {
  const url = getApiUrl('/verify-email');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось подтвердить почту');
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

export async function getAdminRequests(status = '', page = 1, per_page = 20) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', String(page));
  if (per_page) params.set('per_page', String(per_page));
  const url = getApiUrl('/admin/requests') + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить заявки');
  const body = await res.json().catch(() => ({}));
  return { data: body.data || [], meta: body.meta || null };
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
  if (!res.ok) {
    const msg = body.message || body.errors?.status?.[0] || body.errors?.lawyer_id?.[0] || 'Не удалось обновить заявку';
    throw new Error(msg);
  }
  return body.data;
}


export async function getAdminAnalytics(params = {}) {
  const search = new URLSearchParams();
  if (params.calendar_page) search.set('calendar_page', String(params.calendar_page));
  if (params.activity_page) search.set('activity_page', String(params.activity_page));
  const qs = search.toString();
  const url = getApiUrl('/admin/analytics') + (qs ? `?${qs}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Не удалось загрузить аналитику');
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

export async function getAdminSpecialties() {
  const url = getApiUrl('/admin/specialties');
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось загрузить специальности');
  const data = await res.json();
  return data.data || [];
}

export async function createAdminUser(payload) {
  const url = getApiUrl('/admin/users');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message || (body.errors && Object.values(body.errors).flat()[0]) || 'Не удалось создать пользователя';
    throw new Error(msg);
  }
  return body.user;
}

export async function createAdminSpecialty(name) {
  const url = getApiUrl('/admin/specialties');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось создать специальность');
  return data.data;
}

export async function updateAdminSpecialty(id, name) {
  const url = getApiUrl(`/admin/specialties/${id}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось сохранить');
  return data.data;
}

export async function deleteAdminSpecialty(id) {
  const url = getApiUrl(`/admin/specialties/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось удалить');
  return data;
}

export async function updateLawyerSpecialties(lawyerId, specialtyIds) {
  const url = getApiUrl(`/admin/staff/${lawyerId}/specialties`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ specialty_ids: specialtyIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось обновить специальности');
  return data.data;
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

export async function updateAdminUserRole(userId, role) {
  const url = getApiUrl(`/admin/users/${userId}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось обновить роль');
  return data.user;
}

export async function getServices() {
  const url = getApiUrl('/services');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить услуги');
  const data = await res.json();
  return data.data || [];
}

export async function getAdminServicesMeta() {
  const url = getApiUrl('/admin/services/meta');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить справочники');
  return data;
}

export async function getAdminServices(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.category) qs.set('category', params.category);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const url = getApiUrl(`/admin/services/manage${suffix}`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить услуги');
  return data.data || [];
}

export async function createAdminService(payload) {
  const url = getApiUrl('/admin/services/manage');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.message ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Не удалось создать услугу';
    throw new Error(msg);
  }
  return data.data;
}

export async function updateAdminService(id, payload) {
  const url = getApiUrl(`/admin/services/manage/${id}`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.message ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Не удалось сохранить услугу';
    throw new Error(msg);
  }
  return data.data;
}

export async function deleteAdminService(id) {
  const url = getApiUrl(`/admin/services/manage/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось удалить услугу');
  return data;
}

/** Юристы для главной страницы (публичный список) */
export async function getPublicStaff() {
  const url = getApiUrl('/staff');
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить сотрудников');
  return data.data || [];
}

export async function getService(id) {
  const url = getApiUrl(`/services/${id}`);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Услуга не найдена');
  return data.data;
}

export async function getPosts(params = {}) {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.status) search.set('status', params.status);
  if (params.tag) search.set('tag', params.tag);
  if (params.page) search.set('page', String(params.page));
  if (params.per_page) search.set('per_page', String(params.per_page));
  const qs = search.toString();
  const url = getApiUrl('/posts') + (qs ? `?${qs}` : '');
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить посты');
  return {
    data: data.data || [],
    meta: data.meta || null,
  };
}

export async function getPostBySlug(slug) {
  const url = getApiUrl(`/posts/${slug}`);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Пост не найден');
  return data.data;
}

export async function getAdminPosts(params = {}) {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.status) search.set('status', params.status);
  if (params.tag) search.set('tag', params.tag);
  const qs = search.toString();
  const url = getApiUrl('/admin/posts') + (qs ? `?${qs}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить посты');
  return data.data || [];
}

export async function createAdminPost(payload) {
  const url = getApiUrl('/admin/posts');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось создать пост');
  return data.data;
}

export async function updateAdminPost(id, payload) {
  const url = getApiUrl(`/admin/posts/${id}`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось обновить пост');
  return data.data;
}

export async function uploadAdminPostImage(file) {
  const url = getApiUrl('/admin/posts/upload-image');
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить изображение');
  return data.data;
}

export async function deleteAdminPost(id) {
  const url = getApiUrl(`/admin/posts/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось удалить пост');
  return data;
}

export async function getReviews(params = {}) {
  const search = new URLSearchParams();
  if (params.lawyerId) search.set('lawyer_id', String(params.lawyerId));
  if (params.sort) search.set('sort', params.sort);
  const qs = search.toString();
  const url = getApiUrl('/reviews' + (qs ? `?${qs}` : ''));
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить отзывы');
  const data = await res.json();
  return data.data || [];
}

/** Юристы, у которых есть опубликованные отзывы (для фильтра). */
export async function getReviewLawyers() {
  const url = getApiUrl('/reviews/lawyers');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить список юристов');
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

export async function update2faSetting(twoFactorEnabled, currentPassword) {
  const url = getApiUrl('/user/2fa');
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      two_factor_enabled: twoFactorEnabled,
      current_password: currentPassword,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось изменить настройку');
  return data;
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

/** Сообщение об ошибке из ответа Laravel (422 и др.). */
export function getApiErrorMessage(body, fallback = 'Ошибка запроса') {
  if (!body || typeof body !== 'object') return fallback;
  if (body.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat().find(Boolean);
    if (first) return String(first);
  }
  if (body.message) return String(body.message);
  return fallback;
}

/** Публичный URL файла в storage бэкенда (обложки, вложения чата). */
export function getPublicStorageUrl(relativePath) {
  if (!relativePath) return '';
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  return `${base}/storage/${String(relativePath).replace(/^\/+/, '')}`;
}

export async function getConversations() {
  const url = getApiUrl('/chats');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось загрузить список чатов'));
  return body.data || [];
}

export async function getConversationByRequestId(requestId) {
  const url = getApiUrl(`/requests/${requestId}/conversation`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось загрузить чат'));
  return body;
}

export async function getConversationMessages(conversationId, params = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.per_page) search.set('per_page', String(params.per_page));
  const qs = search.toString();
  const url = getApiUrl(`/chats/${conversationId}/messages`) + (qs ? `?${qs}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось загрузить сообщения'));
  return body;
}

export async function postConversationRead(conversationId) {
  const url = getApiUrl(`/chats/${conversationId}/read`);
  const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось отметить прочтение'));
  return body;
}

export async function postConversationTextMessage(conversationId, content, replyToMessageId = null) {
  const url = getApiUrl(`/chats/${conversationId}/messages`);
  const payload = { type: 'text', content };
  if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось отправить сообщение'));
  return body.data;
}

export async function postConversationFileMessage(conversationId, type, file, caption = '', replyToMessageId = null) {
  const url = getApiUrl(`/chats/${conversationId}/messages`);
  const fd = new FormData();
  fd.append('type', type);
  fd.append('file', file);
  if (caption) fd.append('content', caption);
  if (replyToMessageId) fd.append('reply_to_message_id', String(replyToMessageId));
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: fd,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось отправить файл'));
  return body.data;
}

export async function patchConversationMessage(conversationId, messageId, content) {
  const url = getApiUrl(`/chats/${conversationId}/messages/${messageId}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось изменить сообщение'));
  return body.data;
}

export async function deleteConversationMessage(conversationId, messageId) {
  const url = getApiUrl(`/chats/${conversationId}/messages/${messageId}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Не удалось удалить сообщение'));
  return body;
}

export async function downloadChatAttachment(conversationId, attachmentId) {
  const url = getApiUrl(`/chats/${conversationId}/attachments/${attachmentId}/download`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Не удалось скачать файл');
  return res.blob();
}

const PLACEHOLDER_AVATAR = '/images/avatars/placeholder_avatar.png';

// ——— Консультации / встречи ———

export async function getMeetings(params = {}) {
  const search = new URLSearchParams();
  if (params.month) search.set('month', params.month);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.status) search.set('status', params.status);
  if (params.lawyer_id) search.set('lawyer_id', String(params.lawyer_id));
  if (params.request_id) search.set('request_id', String(params.request_id));
  const qs = search.toString();
  const url = getApiUrl('/meetings') + (qs ? `?${qs}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить консультации');
  return data.data || [];
}

export async function getRequestMeetings(requestId) {
  const url = getApiUrl(`/requests/${requestId}/meetings`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить консультации');
  return data.data || [];
}

export async function createRequestMeeting(requestId, payload) {
  const url = getApiUrl(`/requests/${requestId}/meetings`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось создать консультацию');
  return data.data;
}

export async function updateMeeting(id, payload) {
  const url = getApiUrl(`/meetings/${id}`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось обновить консультацию');
  return data.data;
}

export async function confirmMeeting(id) {
  const url = getApiUrl(`/meetings/${id}/confirm`);
  const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось подтвердить');
  return data.data;
}

export async function cancelMeeting(id, cancellation_reason) {
  const url = getApiUrl(`/meetings/${id}/cancel`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ cancellation_reason: cancellation_reason || null }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось отменить');
  return data.data;
}

export async function completeMeeting(id) {
  const url = getApiUrl(`/meetings/${id}/complete`);
  const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось завершить');
  return data.data;
}

export async function getLawyerBusySlots(lawyerId, from, to) {
  const search = new URLSearchParams();
  if (from) search.set('from', from);
  if (to) search.set('to', to);
  const url = getApiUrl(`/lawyers/${lawyerId}/busy-slots`) + (search.toString() ? `?${search.toString()}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить занятость');
  return data.data || [];
}

// ——— Уведомления ———

export async function getNotifications(params = {}) {
  const search = new URLSearchParams();
  if (params.unread) search.set('unread', '1');
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  const url = getApiUrl('/notifications') + (qs ? `?${qs}` : '');
  const res = await fetch(url, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить уведомления');
  return { data: data.data || [], meta: data.meta || {} };
}

export async function markNotificationRead(id) {
  const url = getApiUrl(`/notifications/${id}/read`);
  const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Ошибка');
  return data.data;
}

export async function markAllNotificationsRead() {
  const url = getApiUrl('/notifications/read-all');
  const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Ошибка');
  }
}

export function getAvatarUrl(userOrPath) {
  const path = typeof userOrPath === 'object' ? userOrPath?.avatar_path : userOrPath;
  if (!path) return PLACEHOLDER_AVATAR;
  if (path.startsWith('http')) return path;
  // путь вида /images/... — это фронт (заглушка), отдаём как есть
  if (path.startsWith('/images/')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return base + '/storage/' + path.replace(/^\/+/, '');
}