import { useEffect, useState } from 'react';
import { getAdminLawyers } from '../../lib/api';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local) {
  if (!local) return '';
  return new Date(local).toISOString();
}

const empty = {
  title: '',
  description: '',
  meeting_type: 'offline',
  start_at: '',
  end_at: '',
  location: '',
  meeting_link: '',
  responsible_lawyer_id: '',
};

export default function MeetingForm({ initial, onSubmit, onCancel, submitLabel = 'Сохранить', showLawyerSelect = false }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const [lawyers, setLawyers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showLawyerSelect) return;
    getAdminLawyers()
      .then(setLawyers)
      .catch(() => setLawyers([]));
  }, [showLawyerSelect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        meeting_type: form.meeting_type,
        start_at: localInputToIso(form.start_at),
        end_at: localInputToIso(form.end_at),
        location: form.meeting_type === 'offline' ? form.location.trim() : null,
        meeting_link: form.meeting_type === 'online' ? form.meeting_link.trim() : null,
      };
      if (showLawyerSelect && form.responsible_lawyer_id) {
        payload.responsible_lawyer_id = Number(form.responsible_lawyer_id);
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="meeting-form" onSubmit={handleSubmit}>
      {error && <p className="meeting-form__error">{error}</p>}
      <label className="meeting-form__label">
        Заголовок
        <input name="title" className="meeting-form__input" value={form.title} onChange={handleChange} required />
      </label>
      <label className="meeting-form__label">
        Описание
        <textarea name="description" className="meeting-form__textarea" rows={3} value={form.description} onChange={handleChange} />
      </label>
      <label className="meeting-form__label">
        Тип
        <select name="meeting_type" className="meeting-form__input" value={form.meeting_type} onChange={handleChange}>
          <option value="offline">Очная</option>
          <option value="online">Онлайн</option>
        </select>
      </label>
      <label className="meeting-form__label">
        Начало
        <input type="datetime-local" name="start_at" className="meeting-form__input" value={form.start_at} onChange={handleChange} required />
      </label>
      <label className="meeting-form__label">
        Окончание
        <input type="datetime-local" name="end_at" className="meeting-form__input" value={form.end_at} onChange={handleChange} required />
      </label>
      {form.meeting_type === 'offline' ? (
        <label className="meeting-form__label">
          Адрес
          <input name="location" className="meeting-form__input" value={form.location} onChange={handleChange} required />
        </label>
      ) : (
        <label className="meeting-form__label">
          Ссылка на встречу
          <input name="meeting_link" className="meeting-form__input" value={form.meeting_link} onChange={handleChange} required />
        </label>
      )}
      {showLawyerSelect && (
        <label className="meeting-form__label">
          Ответственный юрист
          <select name="responsible_lawyer_id" className="meeting-form__input" value={form.responsible_lawyer_id} onChange={handleChange}>
            <option value="">По заявке</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="meeting-form__actions">
        {onCancel && (
          <button type="button" className="meeting-form__btn meeting-form__btn--ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className="meeting-form__btn meeting-form__btn--primary" disabled={saving}>
          {saving ? 'Сохранение…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export { toLocalInputValue, localInputToIso };
