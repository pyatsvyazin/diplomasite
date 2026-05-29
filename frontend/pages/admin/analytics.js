import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics } from '../../lib/api';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

function AnalyticsCharts({ data }) {
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    import('recharts').then(setCharts);
  }, []);

  if (!charts || !data) return <p className="admin-analytics__loading">Загрузка графиков…</p>;

  const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
  } = charts;

  const monthData = (data.requests_by_month?.labels || []).map((label, i) => ({
    name: label,
    count: data.requests_by_month?.values?.[i] ?? 0,
  }));

  const pieData = (data.requests_status_pie || []).filter((s) => s.count > 0);
  const barData = data.top_subjects || [];

  return (
    <div className="admin-analytics__charts">
      <div className="admin-analytics__chart-card">
        <h3>Заявки по месяцам</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} name="Заявки" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="admin-analytics__chart-card">
        <h3>Статусы заявок</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={pieData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
              {pieData.map((entry, index) => (
                <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="admin-analytics__chart-card admin-analytics__chart-card--wide">
        <h3>Популярные темы обращений</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="subject" width={140} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" name="Заявки" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    setLoading(true);
    getAdminAnalytics()
      .then(setData)
      .catch((e) => setError(e.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [authLoading, isAdmin]);

  return (
    <AdminLayout>
      <div className="page admin-analytics">
        <h1 className="admin-page-title">Аналитика</h1>
        {!isAdmin && !authLoading && (
          <p className="admin-error">Раздел доступен только администраторам.</p>
        )}
        {isAdmin && error && <p className="admin-error">{error}</p>}
        {isAdmin && loading && <p>Загрузка…</p>}
        {isAdmin && data && (
          <>
            <div className="admin-analytics__cards">
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.requests_total}</span>
                <span className="admin-analytics__card-label">Всего заявок</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.requests_active}</span>
                <span className="admin-analytics__card-label">В работе / активные</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.requests_closed}</span>
                <span className="admin-analytics__card-label">Закрыто</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.meetings_total}</span>
                <span className="admin-analytics__card-label">Консультаций</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.meetings_upcoming}</span>
                <span className="admin-analytics__card-label">Предстоящих</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.clients_count}</span>
                <span className="admin-analytics__card-label">Клиентов</span>
              </div>
              <div className="admin-analytics__card">
                <span className="admin-analytics__card-value">{data.lawyers_count}</span>
                <span className="admin-analytics__card-label">Юристов</span>
              </div>
            </div>

            <AnalyticsCharts data={data} />

            <div className="admin-analytics__bottom">
              <section className="admin-analytics__section">
                <h2>Консультации в этом месяце</h2>
                {(data.calendar_meetings || []).length === 0 ? (
                  <p>Нет назначенных консультаций в текущем месяце.</p>
                ) : (
                  <ul className="admin-analytics__meetings-list">
                    {data.calendar_meetings.map((m) => (
                      <li key={m.id}>
                        <strong>{m.title}</strong>
                        <span>
                          {m.start_at
                            ? new Date(m.start_at).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                          {m.lawyer_name ? ` · ${m.lawyer_name}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="admin-analytics__section">
                <h2>Последние действия</h2>
                <ul className="admin-analytics__activity">
                  {(data.recent_activity || []).map((item, idx) => (
                    <li key={`${item.type}-${item.id}-${idx}`}>
                      <span className="admin-analytics__activity-type">
                        {item.type === 'meeting' ? 'Консультация' : 'Заявка'}
                      </span>
                      <span>{item.title}</span>
                      {item.subtitle && <span className="admin-analytics__activity-sub">{item.subtitle}</span>}
                      {item.at && (
                        <time dateTime={item.at}>
                          {new Date(item.at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                        </time>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
