import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders, updateAdminUserBlock } from '../../lib/api';
import { formatPhone } from '../../lib/phone';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [blockingId, setBlockingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchDebounce) params.set('search', searchDebounce);
    if (roleFilter) params.set('role', roleFilter);
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
    fetch(getApiUrl('/admin/users') + '?' + params.toString(), {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 403) return { users: [] };
        return { users: [] };
      })
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [searchDebounce, roleFilter, sortBy, sortOrder]);

  const handleBlockToggle = async (user) => {
    setError('');
    setBlockingId(user.id);
    try {
      await updateAdminUserBlock(user.id, !user.is_blocked);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
      );
    } catch (e) {
      setError(e.message || 'Ошибка при изменении блокировки');
    } finally {
      setBlockingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Все пользователи</h1>
        {error && <p className="admin-error" style={{ color: 'var(--color-error, #c00)', marginBottom: '0.5rem' }}>{error}</p>}
        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Поиск по имени, email, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="admin-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Все роли</option>
            <option value="client">Клиент</option>
            <option value="lawyer">Юрист</option>
            <option value="admin">Администратор</option>
          </select>
          <select
            className="admin-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Сортировка по"
          >
            <option value="full_name">По ФИО</option>
            <option value="created_at">По дате регистрации</option>
          </select>
          <select
            className="admin-filter"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            title="Порядок"
          >
            <option value="asc">По возрастанию (А→Я, старые сначала)</option>
            <option value="desc">По убыванию (Я→А, новые сначала)</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          {loading ? (
            <p className="admin-empty">Загрузка...</p>
          ) : users.length === 0 ? (
            <p className="admin-empty">Пользователи не найдены</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Роли</th>
                  <th>Блокировка</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone ? formatPhone(u.phone) : '—'}</td>
                    <td className="roles-cell">
                      {u.roles?.length ? u.roles.map((r) => r.name).join(', ') : '—'}
                    </td>
                    <td>
                      {u.is_blocked ? (
                        <span className="admin-badge admin-badge--blocked">Заблокирован</span>
                      ) : (
                        <span className="admin-badge admin-badge--ok">Активен</span>
                      )}
                      <button
                        type="button"
                        className="admin-btn admin-btn--small"
                        disabled={blockingId === u.id}
                        onClick={() => handleBlockToggle(u)}
                        title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      >
                        {blockingId === u.id ? '…' : u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
