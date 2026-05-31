import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import ModalShell from '../../../components/ModalShell';
import {
  SERVICE_CATEGORY_BUSINESS,
  SERVICE_CATEGORY_INDIVIDUALS,
} from '../../../constants/serviceCategories';
import {
  createAdminService,
  deleteAdminService,
  getAdminServices,
  getAdminServicesMeta,
  updateAdminService,
} from '../../../lib/api';

function emptyForm() {
  return {
    name: '',
    short_description: '',
    full_description: '',
    category: SERVICE_CATEGORY_INDIVIDUALS,
    price_type: 'fixed',
    price_from: '',
    price_to: '',
    is_popular: false,
  };
}

function serviceToForm(s) {
  return {
    name: s.name || '',
    short_description: s.short_description || '',
    full_description: s.full_description || '',
    category: s.category || SERVICE_CATEGORY_INDIVIDUALS,
    price_type: typeof s.price_type === 'string' ? s.price_type : s.price_type?.value || 'fixed',
    price_from: s.price_from != null ? String(s.price_from) : '',
    price_to: s.price_to != null ? String(s.price_to) : '',
    is_popular: Boolean(s.is_popular),
  };
}

function formToPayload(form) {
  const priceFrom =
    form.price_from === '' || form.price_from == null ? null : parseInt(String(form.price_from), 10);
  const priceTo =
    form.price_to === '' || form.price_to == null ? null : parseInt(String(form.price_to), 10);

  return {
    name: form.name.trim(),
    short_description: form.short_description.trim() || null,
    full_description: form.full_description.trim() || null,
    category: form.category,
    price_type: form.price_type,
    price_from: Number.isFinite(priceFrom) ? priceFrom : null,
    price_to: Number.isFinite(priceTo) ? priceTo : null,
    is_popular: form.is_popular,
  };
}

export default function AdminContentServicesPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ categories: [], price_types: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 380);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchDebounced) params.search = searchDebounced;
      if (categoryFilter) params.category = categoryFilter;
      const list = await getAdminServices(params);
      setItems(list);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    getAdminServicesMeta()
      .then((m) => {
        if (!cancelled && m) setMeta(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm(serviceToForm(row));
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = formToPayload(form);
    if (!payload.name) {
      setFormError('Укажите название.');
      return;
    }

    setSaving(true);
    try {
      if (editingId == null) {
        await createAdminService(payload);
      } else {
        await updateAdminService(editingId, payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Удалить услугу «${row.name}»?`)) return;
    try {
      await deleteAdminService(row.id);
      await load();
    } catch (err) {
      alert(err.message || 'Не удалось удалить');
    }
  };

  const priceFields = useMemo(() => {
    const t = form.price_type;
    return {
      showFrom: t === 'fixed' || t === 'from' || t === 'range',
      showTo: t === 'range',
    };
  }, [form.price_type]);

  const priceTypeLabel = useCallback(
    (value) => meta.price_types?.find((p) => p.value === value)?.label || value,
    [meta.price_types]
  );

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Контент: Услуги</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: '#555', maxWidth: 720 }}>
          Услуги отображаются на главной странице и в разделах «Услуги» для физлиц и бизнеса. Поиск по названию и
          описаниям.
        </p>

        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Поиск по названию или описанию…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Поиск услуг"
          />
          <select
            className="admin-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Фильтр по категории"
          >
            <option value="">Все категории</option>
            <option value={SERVICE_CATEGORY_INDIVIDUALS}>{SERVICE_CATEGORY_INDIVIDUALS}</option>
            <option value={SERVICE_CATEGORY_BUSINESS}>{SERVICE_CATEGORY_BUSINESS}</option>
          </select>
          <button type="button" className="admin-btn" onClick={openCreate}>
            Добавить услугу
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Нет услуг по текущим фильтрам.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Цена на сайте</th>
                  <th>Тип цены</th>
                  <th>Популярная</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.category}</td>
                    <td>{row.formatted_price}</td>
                    <td>{priceTypeLabel(typeof row.price_type === 'string' ? row.price_type : row.price_type?.value)}</td>
                    <td>
                      <span
                        className={`admin-services-table__popular${row.is_popular ? ' admin-services-table__popular--yes' : ''}`}
                      >
                        {row.is_popular ? 'Да' : '—'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => openEdit(row)}>
                        Изменить
                      </button>{' '}
                      <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => onDelete(row)}>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ModalShell open={modalOpen} onClose={closeModal} overlayClassName="admin-services-modal-overlay">
        <div
          className="admin-services-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-services-modal-title"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
            <h2 id="admin-services-modal-title" className="admin-services-modal__title">
              {editingId == null ? 'Новая услуга' : 'Редактирование услуги'}
            </h2>
            <form className="admin-services-form" onSubmit={submitForm}>
              <label>
                <span>Название</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={255}
                />
              </label>

              <label>
                <span>Категория</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  {(meta.categories?.length
                    ? meta.categories
                    : [SERVICE_CATEGORY_INDIVIDUALS, SERVICE_CATEGORY_BUSINESS]
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Краткое описание (карточка на главной)</span>
                <textarea
                  value={form.short_description}
                  onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                  placeholder="Необязательно"
                />
              </label>

              <label>
                <span>Полное описание (страница услуги)</span>
                <textarea
                  className="admin-services-form__textarea--tall"
                  value={form.full_description}
                  onChange={(e) => setForm((f) => ({ ...f, full_description: e.target.value }))}
                  placeholder="Необязательно"
                />
              </label>

              <label>
                <span>Тип цены</span>
                <select
                  value={form.price_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_type: e.target.value,
                      price_from: '',
                      price_to: '',
                    }))
                  }
                  required
                >
                  {(meta.price_types?.length
                    ? meta.price_types
                    : [
                        { value: 'fixed', label: 'Фиксированная цена' },
                        { value: 'from', label: 'Цена «от»' },
                        { value: 'range', label: 'Диапазон' },
                        { value: 'custom', label: 'По договорённости' },
                      ]
                  ).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="admin-services-form__hint">
                  Фиксированная и «от» — одна сумма в рублях; диапазон — «от» и «до»; по договорённости суммы не нужны.
                </p>
              </label>

              {priceFields.showFrom && (
                <label>
                  <span>{form.price_type === 'range' ? 'Цена от (₽)' : 'Цена (₽)'}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price_from}
                    onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value }))}
                    required={priceFields.showFrom}
                  />
                </label>
              )}

              {priceFields.showTo && (
                <label>
                  <span>Цена до (₽)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price_to}
                    onChange={(e) => setForm((f) => ({ ...f, price_to: e.target.value }))}
                    required={priceFields.showTo}
                  />
                </label>
              )}

              <label className="admin-services-form__check">
                <input
                  type="checkbox"
                  checked={form.is_popular}
                  onChange={(e) => setForm((f) => ({ ...f, is_popular: e.target.checked }))}
                />
                Показывать выше остальных (популярная)
              </label>

              {formError && <p className="admin-error">{formError}</p>}

              <div className="admin-services-modal__actions">
                <button type="button" className="admin-btn admin-btn--ghost" onClick={closeModal} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" className="admin-btn" disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
        </div>
      </ModalShell>
    </AdminLayout>
  );
}
