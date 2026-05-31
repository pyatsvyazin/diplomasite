import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, getAuthHeaders, updateAdminUserBlock, updateAdminUserRole } from '../../lib/api';
import { formatPhone } from '../../lib/phone';
import { roleLabel } from '../../constants/userRoles';
import AdminCreateUserModal from '../../components/admin/AdminCreateUserModal';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles?.some((r) => r.name === 'admin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [blockingId, setBlockingId] = useState(null);
  const [roleChangingId, setRoleChangingId] = useState(null);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [searchDebounce, roleFilter, sortBy, sortOrder, refreshKey]);

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

  const handleRoleChange = async (userId, nextRole) => {
    setError('');
    setRoleChangingId(userId);
    try {
      const updated = await updateAdminUserRole(userId, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError(e.message || 'Ошибка при смене роли');
    } finally {
      setRoleChangingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Все пользователи</h1>
        {error && <p className="admin-error" style={{ color: 'var(--color-error, #c00)', marginBottom: '0.5rem' }}>{error}</p>}
        <div className="admin-toolbar admin-toolbar--users">
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
          {isAdmin && (
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-toolbar__register-btn"
              onClick={() => setCreateModalOpen(true)}
            >
              Регистрация пользователя
            </button>
          )}
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
                      <div className="admin-users__role-wrap">
                        <select
                          className="admin-filter admin-users__role-select"
                          value={u.roles?.[0]?.name || ''}
                          disabled={roleChangingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="client">{roleLabel('client')}</option>
                          <option value="lawyer">{roleLabel('lawyer')}</option>
                          <option value="admin">{roleLabel('admin')}</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div className="admin-users__block-cell">
                        {u.is_blocked ? (
                          <span className="admin-badge admin-badge--blocked">Заблокирован</span>
                        ) : (
                          <span className="admin-badge admin-badge--ok">Активен</span>
                        )}
                        <button
                          type="button"
                          className={`admin-btn admin-btn--small ${u.is_blocked ? 'admin-btn--ghost' : 'admin-btn--danger'}`}
                          disabled={blockingId === u.id}
                          onClick={() => handleBlockToggle(u)}
                          title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {blockingId === u.id ? '…' : u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      </div>
                    </td>
                    <td className="admin-users__created-at">{u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <AdminCreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </AdminLayout>
  );
}
