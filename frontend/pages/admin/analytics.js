import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import PostsPagination from '../../components/PostsPagination';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics } from '../../lib/api';
import { ADMIN_ANALYTICS_REFRESH_EVENT } from '../../lib/adminEvents';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

/** Единый формат даты на аналитике: «29 мая, 00:37» */
function formatAnalyticsDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timePart = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}

const MEETING_STATUS_LABELS = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
  overdue: 'Просрочена',
};

function getMeetingDisplayStatus(meeting) {
  if (meeting.status === 'pending' && meeting.start_at && new Date(meeting.start_at) < new Date()) {
    return 'overdue';
  }
  return meeting.status || 'pending';
}

const ACTIVITY_EVENT_META = {
  user_registered: { label: 'Регистрация', tone: 'success' },
  post_created: { label: 'Создание', tone: 'success' },
  post_updated: { label: 'Изменение', tone: 'info' },
  post_status_changed: { label: 'Статус поста', tone: 'info' },
  post_deleted: { label: 'Удаление', tone: 'danger' },
  request_lawyer_assigned: { label: 'Назначение', tone: 'info' },
  request_lawyer_unassigned: { label: 'Снятие юриста', tone: 'warning' },
  meeting_created: { label: 'Консультация', tone: 'info' },
  meeting_rescheduled: { label: 'Перенос', tone: 'warning' },
  meeting_cancelled: { label: 'Отмена', tone: 'danger' },
  meeting_completed: { label: 'Завершение', tone: 'success' },
  request_status_changed: { label: 'Статус заявки', tone: 'info' },
  user_blocked: { label: 'Блокировка', tone: 'danger' },
  user_unblocked: { label: 'Разблокировка', tone: 'success' },
  user_role_changed: { label: 'Смена роли', tone: 'info' },
  staff_updated: { label: 'Данные сотрудника', tone: 'info' },
};

function getActivityEventMeta(item) {
  const base = ACTIVITY_EVENT_META[item.event_type] || { label: 'Действие', tone: 'neutral' };
  let tone = base.tone;

  if (item.event_type === 'request_status_changed' && item.summary) {
    if (/→ «(Закрыта|Отклонена)»/.test(item.summary)) tone = 'danger';
    else if (/→ «(В работе|На рассмотрении)»/.test(item.summary)) tone = 'info';
    else if (/→ «Новая»/.test(item.summary)) tone = 'success';
  }

  if (item.event_type === 'post_status_changed' && item.summary) {
    if (/→ «в архиве»/i.test(item.summary)) tone = 'warning';
    else if (/→ «опубликовано»/i.test(item.summary)) tone = 'success';
  }

  return { label: base.label, tone };
}

function AnalyticsSummary({ summary, fallback }) {
  const s = summary || {
    requests: {
      total: fallback?.requests_total,
      active: fallback?.requests_active,
      reviewing: fallback?.requests_reviewing,
      closed: fallback?.requests_closed,
    },
    meetings: {
      total: fallback?.meetings_total,
      upcoming: fallback?.meetings_upcoming,
      completed: fallback?.meetings_completed,
      overdue: fallback?.meetings_overdue,
    },
    users: {
      clients: fallback?.clients_count,
      lawyers: fallback?.lawyers_count,
      admins: fallback?.admins_count,
    },
    posts: {
      articles: fallback?.posts_articles,
      pages: fallback?.posts_pages,
      news: fallback?.posts_news,
      archived: fallback?.posts_archived,
    },
  };

  const blocks = [
    {
      title: 'Заявки',
      rows: [
        { label: 'Всего', value: s.requests?.total },
        { label: 'Активные (в работе)', value: s.requests?.active },
        { label: 'На рассмотрении', value: s.requests?.reviewing },
        { label: 'Закрытые', value: s.requests?.closed },
      ],
    },
    {
      title: 'Консультации',
      rows: [
        { label: 'Всего', value: s.meetings?.total },
        { label: 'Предстоящие (подтверждённые)', value: s.meetings?.upcoming },
        { label: 'Завершённые и отменённые', value: s.meetings?.completed },
        { label: 'Просроченные', value: s.meetings?.overdue },
      ],
    },
    {
      title: 'Пользователи',
      rows: [
        { label: 'Клиенты', value: s.users?.clients },
        { label: 'Юристы', value: s.users?.lawyers },
        { label: 'Администраторы', value: s.users?.admins },
      ],
    },
    {
      title: 'Посты',
      rows: [
        { label: 'Статей', value: s.posts?.articles },
        { label: 'Страниц', value: s.posts?.pages },
        { label: 'Новостей', value: s.posts?.news },
        { label: 'В архиве', value: s.posts?.archived },
      ],
    },
  ];

  return (
    <div className="admin-analytics__summary">
      {blocks.map((block) => (
        <section key={block.title} className="admin-analytics__summary-block">
          <h2 className="admin-analytics__summary-title">{block.title}</h2>
          <ul className="admin-analytics__summary-list">
            {block.rows.map((row) => (
              <li key={row.label} className="admin-analytics__summary-row">
                <span className="admin-analytics__summary-label">{row.label}</span>
                <span className="admin-analytics__summary-value">{row.value ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

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
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
              isAnimationActive={false}
            >
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
            <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="subject"
              width={100}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => (String(v).length > 22 ? `${String(v).slice(0, 20)}…` : v)}
            />
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
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [calendarPage, setCalendarPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [mobileFeedTab, setMobileFeedTab] = useState('calendar');
  const readyRef = useRef(false);

  const load = useCallback(
    (calendarPg, activityPg, initial = false) => {
      if (initial) setLoading(true);
      else setListLoading(true);
      setError('');
      getAdminAnalytics({ calendar_page: calendarPg, activity_page: activityPg })
        .then(setData)
        .catch((e) => setError(e.message || 'Ошибка загрузки'))
        .finally(() => {
          setLoading(false);
          setListLoading(false);
        });
    },
    [],
  );

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const initial = !readyRef.current;
    readyRef.current = true;
    load(calendarPage, activityPage, initial);
  }, [authLoading, isAdmin, calendarPage, activityPage, load]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let debounceId = null;
    const onRefresh = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        load(calendarPage, activityPage, false);
      }, 400);
    };
    window.addEventListener(ADMIN_ANALYTICS_REFRESH_EVENT, onRefresh);
    return () => {
      clearTimeout(debounceId);
      window.removeEventListener(ADMIN_ANALYTICS_REFRESH_EVENT, onRefresh);
    };
  }, [isAdmin, calendarPage, activityPage, load]);

  const handleCalendarPage = (page) => setCalendarPage(page);
  const handleActivityPage = (page) => setActivityPage(page);

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
            <AnalyticsSummary summary={data.summary} fallback={data} />

            <AnalyticsCharts data={data} />

            <div className="admin-analytics__feed-tabs" role="tablist" aria-label="Разделы ленты">
              <button
                type="button"
                role="tab"
                aria-selected={mobileFeedTab === 'calendar'}
                className={`admin-analytics__feed-tab${mobileFeedTab === 'calendar' ? ' admin-analytics__feed-tab--active' : ''}`}
                onClick={() => setMobileFeedTab('calendar')}
              >
                Консультации
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileFeedTab === 'activity'}
                className={`admin-analytics__feed-tab${mobileFeedTab === 'activity' ? ' admin-analytics__feed-tab--active' : ''}`}
                onClick={() => setMobileFeedTab('activity')}
              >
                Последние действия
              </button>
            </div>

            <div className={`admin-analytics__bottom${listLoading ? ' admin-analytics__bottom--loading' : ''}`}>
              <section
                className={`admin-analytics__section admin-analytics__section--calendar${mobileFeedTab !== 'calendar' ? ' admin-analytics__section--mobile-hidden' : ''}`}
              >
                <h2>Консультации в этом месяце</h2>
                {(data.calendar_meetings || []).length === 0 ? (
                  <p>Нет назначенных консультаций в текущем месяце.</p>
                ) : (
                  <>
                    <ul className="admin-analytics__feed">
                      {data.calendar_meetings.map((m) => {
                        const displayStatus = getMeetingDisplayStatus(m);
                        return (
                          <li
                            key={m.id}
                            className={`admin-analytics__feed-item admin-analytics__feed-item--tone-${displayStatus}`}
                          >
                            <div className="admin-analytics__feed-head">
                              <span className={`admin-analytics__badge admin-analytics__badge--${displayStatus}`}>
                                {MEETING_STATUS_LABELS[displayStatus] || displayStatus}
                              </span>
                              <time dateTime={m.start_at}>{formatAnalyticsDateTime(m.start_at)}</time>
                            </div>
                            <p className="admin-analytics__feed-title">{m.title}</p>
                            {m.lawyer_name && (
                              <p className="admin-analytics__feed-meta">Юрист: {m.lawyer_name}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <PostsPagination
                      page={data.calendar_meta?.current_page || calendarPage}
                      lastPage={data.calendar_meta?.last_page || 1}
                      onPageChange={handleCalendarPage}
                    />
                  </>
                )}
              </section>
              <section
                className={`admin-analytics__section admin-analytics__section--activity${mobileFeedTab !== 'activity' ? ' admin-analytics__section--mobile-hidden' : ''}`}
              >
                <h2>Последние действия за 30 дней</h2>
                {(data.recent_activity || []).length === 0 ? (
                  <p>Нет записей. События появятся после действий сотрудников в системе.</p>
                ) : (
                  <>
                    <ul className="admin-analytics__feed">
                      {data.recent_activity.map((item) => {
                        const { label, tone } = getActivityEventMeta(item);
                        return (
                          <li
                            key={item.id}
                            className={`admin-analytics__feed-item admin-analytics__feed-item--tone-${tone}`}
                          >
                            <div className="admin-analytics__feed-head">
                              <span className={`admin-analytics__badge admin-analytics__badge--${tone}`}>{label}</span>
                              {item.at && (
                                <time dateTime={item.at}>{formatAnalyticsDateTime(item.at)}</time>
                              )}
                            </div>
                            <p className="admin-analytics__feed-actor">{item.actor_name}</p>
                            <p className="admin-analytics__feed-summary">{item.summary}</p>
                          </li>
                        );
                      })}
                    </ul>
                    <PostsPagination
                      page={data.activity_meta?.current_page || activityPage}
                      lastPage={data.activity_meta?.last_page || 1}
                      onPageChange={handleActivityPage}
                    />
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
