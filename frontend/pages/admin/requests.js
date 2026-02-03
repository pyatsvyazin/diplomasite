import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminRequests } from '../../lib/api';
import RequestCard from '../../components/admin/RequestCard';

const STATUS_FILTERS = [
  { value: '', label: 'Все заявки' },
  { value: 'new', label: 'Новые' },
  { value: 'reviewing', label: 'Рассматриваются' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'closed', label: 'Закрытые' },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    getAdminRequests(statusFilter)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Заявки</h1>
        <div className="admin-toolbar">
          <div className="admin-requests-filters">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value || 'all'}
                type="button"
                className={`admin-requests-filter ${statusFilter === value ? 'admin-requests-filter--active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="admin-requests-loading">Загрузка заявок...</p>
        ) : requests.length === 0 ? (
          <p className="admin-requests-empty">Нет заявок</p>
        ) : (
          <div className="request-card-list">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}