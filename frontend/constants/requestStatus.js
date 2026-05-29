/** Совпадает с карточками заявок в профиле (profile-request-card__status--*) */
export const REQUEST_STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'Рассматривается',
  in_progress: 'В работе',
  rejected: 'Отклонена',
  closed: 'Закрыта',
};

export function requestStatusLabel(status) {
  if (status == null || status === '') return '—';
  return REQUEST_STATUS_LABELS[status] ?? String(status);
}
