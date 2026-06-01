import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../../../components/AdminLayout';
import ModalShell from '../../../components/ModalShell';
import Avatar from '../../../components/Avatar';
import StarRating from '../../../components/StarRating';
import {
  getAdminStaff,
  getAdminSpecialties,
  updateAdminStaffMember,
  updateLawyerSpecialties,
  createAdminSpecialty,
  updateAdminSpecialty,
  deleteAdminSpecialty,
  getAvatarUrl,
} from '../../../lib/api';
import { formatPhone, normalizeDigits, parsePhoneToDigits } from '../../../lib/phone';

const ROLE_LABELS = { lawyer: 'Юрист', admin: 'Администратор' };

/** Выпадающий список в document.body (fixed), чтобы не обрезался overflow у админ-контента */
function FloatingSpecialtyPicker({ open, anchorRef, options, onSelect, onClose }) {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const pad = 12;
      const preferredMax = 280;
      const minW = 220;
      const spaceBelow = window.innerHeight - r.bottom - gap - pad;
      const spaceAbove = r.top - gap - pad;
      const useBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove;
      const left = Math.max(pad, Math.min(r.left, window.innerWidth - minW - pad));
      if (useBelow) {
        setMenuStyle({
          position: 'fixed',
          left,
          top: r.bottom + gap,
          bottom: 'auto',
          maxHeight: Math.min(preferredMax, spaceBelow),
          minWidth: minW,
          zIndex: 10050,
        });
      } else {
        setMenuStyle({
          position: 'fixed',
          left,
          top: 'auto',
          bottom: window.innerHeight - r.top + gap,
          maxHeight: Math.min(preferredMax, spaceAbove),
          minWidth: minW,
          zIndex: 10050,
        });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (anchorRef?.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <ul ref={menuRef} className="staff-specialty-dropdown staff-specialty-dropdown--portal" style={menuStyle}>
      {options.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onSelect(s.id)}>
            {s.name}
          </button>
        </li>
      ))}
    </ul>,
    document.body
  );
}

function LawyerSpecialtyChips({ member, allSpecialties, onUpdated }) {
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const anchorRef = useRef(null);

  const assigned = member.specialties || [];
  const ids = new Set(assigned.map((s) => s.id));
  const available = allSpecialties.filter((s) => !ids.has(s.id));

  const sync = async (newIds) => {
    setSaving(true);
    try {
      const updated = await updateLawyerSpecialties(member.id, newIds);
      onUpdated(updated);
    } catch (e) {
      alert(e.message || 'Ошибка');
    } finally {
      setSaving(false);
      setAddOpen(false);
    }
  };

  const remove = (id) => sync(assigned.filter((s) => s.id !== id).map((s) => s.id));
  const add = (id) => sync([...assigned.map((s) => s.id), id]);

  if (!member.roles?.includes('lawyer')) return null;

  return (
    <div className="staff-card__specialties-row">
      <span className="staff-card__specialties-label">Специализации:</span>
      <div className="staff-card__specialties-chips">
        {assigned.map((s) => (
          <span key={s.id} className="staff-specialty-chip">
            {s.name}
            {member.can_edit && (
              <button
                type="button"
                className="staff-specialty-chip__remove"
                onClick={() => !saving && remove(s.id)}
                disabled={saving}
                aria-label={`Удалить ${s.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {member.can_edit && available.length > 0 && (
          <div className="staff-specialty-add-wrap">
            <button
              ref={anchorRef}
              type="button"
              className="staff-specialty-add"
              onClick={(e) => {
                e.stopPropagation();
                setAddOpen((v) => !v);
              }}
              disabled={saving}
              aria-label="Добавить специальность"
              aria-expanded={addOpen}
            >
              +
            </button>
            <FloatingSpecialtyPicker
              open={addOpen}
              anchorRef={anchorRef}
              options={available}
              onSelect={(id) => add(id)}
              onClose={() => setAddOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StaffSpecialtyFilterRow({ allSpecialties, selectedIds, onChange }) {
  const [addOpen, setAddOpen] = useState(false);
  const anchorRef = useRef(null);
  const selectedSet = new Set(selectedIds);
  const selectedSpecs = allSpecialties.filter((s) => selectedSet.has(s.id));
  const available = allSpecialties.filter((s) => !selectedSet.has(s.id));

  const remove = (id) => onChange(selectedIds.filter((x) => x !== id));
  const add = (id) => {
    onChange([...selectedIds, id]);
    setAddOpen(false);
  };

  return (
    <div className="staff-filters-specialties">
      <span className="staff-filters-specialties__label">Фильтр по специальностям:</span>
        {selectedSpecs.map((s) => (
          <span key={s.id} className="staff-filter-specialty-chip">
            {s.name}
            <button type="button" className="staff-filter-specialty-chip__remove" onClick={() => remove(s.id)} aria-label={`Убрать ${s.name}`}>
              ×
            </button>
          </span>
        ))}
        {available.length > 0 && (
          <div className="staff-specialty-add-wrap">
            <button
              ref={anchorRef}
              type="button"
              className="staff-specialty-add staff-specialty-add--filter"
              onClick={(e) => {
                e.stopPropagation();
                setAddOpen((v) => !v);
              }}
              aria-label="Добавить специальность в фильтр"
              aria-expanded={addOpen}
            >
              +
            </button>
            <FloatingSpecialtyPicker
              open={addOpen}
              anchorRef={anchorRef}
              options={available}
              onSelect={add}
              onClose={() => setAddOpen(false)}
            />
          </div>
        )}
      </div>
  );
}

function StaffCard({ member, allSpecialties, onEdit, onMemberUpdate }) {
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
        <Avatar shape="square" size={120} src={getAvatarUrl(member)} name={member.full_name} />
      </div>
      <div className="staff-card__info">
        <p className="staff-card__name">{member.full_name}</p>
        <p className="staff-card__meta">роль: {roleLabel}</p>
        <p className="staff-card__meta">почта: {member.email || '—'}</p>
        <p className="staff-card__meta">телефон: {member.phone || '—'}</p>
        {isLawyer && (
          <>
            <LawyerSpecialtyChips member={member} allSpecialties={allSpecialties} onUpdated={onMemberUpdate} />
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

function SpecialtiesManageTab({ specialties, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [err, setErr] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr('');
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createAdminSpecialty(newName.trim());
      setNewName('');
      onRefresh();
    } catch (e2) {
      setErr(e2.message || 'Ошибка');
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id) => {
    setErr('');
    try {
      await updateAdminSpecialty(id, editName.trim());
      setEditId(null);
      onRefresh();
    } catch (e2) {
      setErr(e2.message || 'Ошибка');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить специальность «${name}»? Связи с юристами будут сняты.`)) return;
    setErr('');
    try {
      await deleteAdminSpecialty(id);
      onRefresh();
    } catch (e2) {
      setErr(e2.message || 'Ошибка');
    }
  };

  return (
    <div className="staff-specialties-manage">
      <form className="staff-specialties-manage__add" onSubmit={handleAdd}>
        <input
          type="text"
          className="staff-specialties-manage__input"
          placeholder="Новая специальность"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="staff-specialties-manage__btn" disabled={adding}>
          {adding ? '…' : 'Добавить'}
        </button>
      </form>
      {err && <p className="staff-modal__error">{err}</p>}
      <ul className="staff-specialties-manage__list">
        {specialties.map((s) => (
          <li key={s.id} className="staff-specialties-manage__item">
            {editId === s.id ? (
              <>
                <input
                  className="staff-specialties-manage__input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button type="button" className="staff-specialties-manage__btn" onClick={() => saveEdit(s.id)}>
                  Сохранить
                </button>
                <button type="button" className="staff-specialties-manage__btn staff-specialties-manage__btn--ghost" onClick={() => setEditId(null)}>
                  Отмена
                </button>
              </>
            ) : (
              <>
                <span className="staff-specialties-manage__name">{s.name}</span>
                <button
                  type="button"
                  className="staff-specialties-manage__btn staff-specialties-manage__btn--ghost"
                  onClick={() => {
                    setEditId(s.id);
                    setEditName(s.name);
                  }}
                >
                  Изменить
                </button>
                <button type="button" className="staff-specialties-manage__btn staff-specialties-manage__btn--danger" onClick={() => handleDelete(s.id, s.name)}>
                  Удалить
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminContentStaffPage() {
  const [tab, setTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  /** Показывать только тех, у кого есть все выбранные специальности (пустой массив = без фильтра по спец.) */
  const [filterSpecialtyIds, setFilterSpecialtyIds] = useState([]);
  const [sortBy, setSortBy] = useState('name');

  const loadStaff = useCallback(() => {
    setLoading(true);
    getAdminStaff()
      .then(setStaff)
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSpecialties = useCallback(() => {
    getAdminSpecialties().then(setAllSpecialties).catch(() => setAllSpecialties([]));
  }, []);

  const refreshSpecialtiesAndStaff = useCallback(() => {
    loadSpecialties();
    loadStaff();
  }, [loadSpecialties, loadStaff]);

  useEffect(() => {
    loadStaff();
    loadSpecialties();
  }, [loadStaff, loadSpecialties]);

  const filteredStaff = useMemo(() => {
    let list = [...staff];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          (m.full_name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.phone || '').includes(q)
      );
    }
    if (roleFilter === 'lawyer') {
      list = list.filter((m) => m.roles?.includes('lawyer'));
    } else if (roleFilter === 'admin') {
      list = list.filter((m) => m.roles?.includes('admin'));
    }
    if (filterSpecialtyIds.length > 0) {
      list = list.filter((m) => {
        const specIds = new Set((m.specialties || []).map((s) => s.id));
        return filterSpecialtyIds.every((id) => specIds.has(id));
      });
    }
    if (sortBy === 'name') {
      list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'ru'));
    } else if (sortBy === 'rating_desc') {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sortBy === 'rating_asc') {
      list.sort((a, b) => (a.rating ?? 999) - (b.rating ?? 999));
    }
    return list;
  }, [staff, search, roleFilter, filterSpecialtyIds, sortBy]);

  useEffect(() => {
    if (editMember) {
      setForm({
        full_name: editMember.full_name || '',
        email: editMember.email || '',
        phone: editMember.phone ? formatPhone(editMember.phone) : '',
      });
      setError('');
      setAvatarFile(null);
    }
  }, [editMember]);

  const handleMemberUpdate = (updated) => {
    setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

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
          fd.append('phone', parsePhoneToDigits(form.phone) || '');
          fd.append('avatar', avatarFile);
          return fd;
        })()
      : { ...form, phone: parsePhoneToDigits(form.phone) || '' };
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

        <div className="staff-tabs">
          <button
            type="button"
            className={`staff-tabs__btn ${tab === 'staff' ? 'staff-tabs__btn--active' : ''}`}
            onClick={() => setTab('staff')}
          >
            Все сотрудники
          </button>
          <button
            type="button"
            className={`staff-tabs__btn ${tab === 'specialties' ? 'staff-tabs__btn--active' : ''}`}
            onClick={() => setTab('specialties')}
          >
            Специальности
          </button>
        </div>

        {tab === 'staff' && (
          <>
            <div className="staff-filters">
              <input
                type="search"
                className="staff-filters__input"
                placeholder="Поиск по ФИО, почте, телефону"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="staff-filters__select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Все роли</option>
                <option value="lawyer">Только юристы</option>
                <option value="admin">Только администраторы</option>
              </select>
              <select className="staff-filters__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Сортировка: по ФИО</option>
                <option value="rating_desc">Рейтинг: выше сначала</option>
                <option value="rating_asc">Рейтинг: ниже сначала</option>
              </select>
            </div>

            <StaffSpecialtyFilterRow allSpecialties={allSpecialties} selectedIds={filterSpecialtyIds} onChange={setFilterSpecialtyIds} />

            {loading ? (
              <p className="admin-empty">Загрузка...</p>
            ) : filteredStaff.length === 0 ? (
              <p className="admin-empty">Нет сотрудников по выбранным условиям</p>
            ) : (
              <ul className="staff-list">
                {filteredStaff.map((member) => (
                  <li key={member.id}>
                    <StaffCard
                      member={member}
                      allSpecialties={allSpecialties}
                      onEdit={setEditMember}
                      onMemberUpdate={handleMemberUpdate}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'specialties' && (
          <SpecialtiesManageTab specialties={allSpecialties} onRefresh={refreshSpecialtiesAndStaff} />
        )}
      </div>

      <ModalShell open={!!editMember} onClose={() => !saving && setEditMember(null)}>
        {editMember && (
          <div className="staff-modal" role="dialog">
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
                  src={avatarFile ? URL.createObjectURL(avatarFile) : editMember.avatar_path || '/images/avatars/placeholder_avatar.png'}
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
                  type="tel"
                  className="staff-modal__input"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(normalizeDigits(e.target.value)) }))}
                  placeholder="+7 (9XX) XXX-XX-XX"
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
        )}
      </ModalShell>
    </AdminLayout>
  );
}
