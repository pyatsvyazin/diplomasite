import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import Avatar from '../../../components/Avatar';
import StarRating from '../../../components/StarRating';
import { getAdminStaff, updateAdminStaffMember, getAvatarUrl } from '../../../lib/api';

const ROLE_LABELS = { lawyer: 'Юрист', admin: 'Администратор' };

function StaffCard({ member, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const roleLabel = member.roles?.map((r) => ROLE_LABELS[r] || r).join(', ') || '—';
  const isLawyer = member.roles?.includes('lawyer');

  return (
    <div className="staff-card">
      <div className="staff-card__photo-wrap">
        <Avatar
          shape="square"
          size={120}
          src={getAvatarUrl(member)}
          name={member.full_name}
        />
      </div>
      <div className="staff-card__info">
        <p className="staff-card__name">{member.full_name}</p>
        <p className="staff-card__meta">роль: {roleLabel}</p>
        <p className="staff-card__meta">почта: {member.email || '—'}</p>
        <p className="staff-card__meta">телефон: {member.phone || '—'}</p>
        {isLawyer && (
          <>
            <p className="staff-card__meta">кол-во закрытых дел: {member.closed_cases_count ?? 0}</p>
            <div className="staff-card__rating">
              <StarRating value={member.rating ?? 0} size="1rem" />
              <span className="staff-card__rating-value">
                {member.rating != null ? Number(member.rating).toFixed(2) : '—'}
              </span>
            </div>
          </>
        )}
      </div>
      {member.can_edit && (
        <div className="staff-card__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="staff-card__menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Дополнительные действия"
            aria-expanded={menuOpen}
          >
            <span className="staff-card__menu-dots">⋮</span>
          </button>
          {menuOpen && (
            <div className="staff-card__dropdown">
              <button
                type="button"
                className="staff-card__dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(member);
                }}
              >
                Изменить данные
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminContentStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminStaff()
      .then(setStaff)
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  useEffect(() => {
    if (editMember) {
      setForm({
        full_name: editMember.full_name || '',
        email: editMember.email || '',
        phone: editMember.phone || '',
      });
      setError('');
      setAvatarFile(null);
    }
  }, [editMember]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editMember) return;
    setSaving(true);
    setError('');
    const payload = avatarFile
      ? (() => {
          const fd = new FormData();
          fd.append('full_name', form.full_name);
          fd.append('email', form.email);
          fd.append('phone', form.phone);
          fd.append('avatar', avatarFile);
          return fd;
        })()
      : form;
    updateAdminStaffMember(editMember.id, payload)
      .then((updated) => {
        setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditMember(null);
      })
      .catch((err) => setError(err.message || 'Ошибка сохранения'))
      .finally(() => setSaving(false));
  };

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Контент: Сотрудники</h1>
        {loading ? (
          <p className="admin-empty">Загрузка...</p>
        ) : staff.length === 0 ? (
          <p className="admin-empty">Нет сотрудников</p>
        ) : (
          <ul className="staff-list">
            {staff.map((member) => (
              <li key={member.id}>
                <StaffCard member={member} onEdit={setEditMember} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {editMember && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <button
              type="button"
              className="staff-modal__close"
              onClick={() => !saving && setEditMember(null)}
              aria-label="Закрыть"
              disabled={saving}
            >
              ×
            </button>
            <div className="staff-modal__header">
              <h2 className="staff-modal__title">Изменить данные</h2>
            </div>
            <form onSubmit={handleSubmit} className="staff-modal__form">
              <div className="staff-modal__avatar-row">
                <Avatar
                  shape="square"
                  size={80}
                  src={avatarFile ? URL.createObjectURL(avatarFile) : (editMember.avatar_path || '/images/avatars/placeholder_avatar.png')}
                  name={editMember.full_name}
                />
                <label className="staff-modal__avatar-label">
                  <span className="staff-modal__avatar-btn">Выбрать фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="staff-modal__avatar-input"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <label className="staff-modal__label">
                ФИО
                <input
                  type="text"
                  className="staff-modal__input"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </label>
              <label className="staff-modal__label">
                Email
                <input
                  type="email"
                  className="staff-modal__input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="staff-modal__label">
                Телефон
                <input
                  type="text"
                  className="staff-modal__input"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              {error && <p className="staff-modal__error">{error}</p>}
              <div className="staff-modal__actions">
                <button type="button" className="staff-modal__btn staff-modal__btn--secondary" onClick={() => setEditMember(null)} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" className="staff-modal__btn staff-modal__btn--primary" disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
