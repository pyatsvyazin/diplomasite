/** Отображение ролей в интерфейсе (значение в БД → подпись). */
export const ROLE_LABELS = {
  client: 'Клиент',
  lawyer: 'Юрист',
  admin: 'Администратор',
};

export function roleLabel(name) {
  return ROLE_LABELS[name] || name || '—';
}
