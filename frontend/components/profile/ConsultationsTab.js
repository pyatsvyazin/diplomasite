import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cancelMeeting, confirmMeeting, getMeetings } from '../../lib/api';
import MeetingCard from '../meetings/MeetingCard';
import MeetingCreateModal from '../meetings/MeetingCreateModal';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const STATUS_DOT = {
  pending: 'consult-cal__dot--pending',
  confirmed: 'consult-cal__dot--confirmed',
  cancelled: 'consult-cal__dot--cancelled',
  completed: 'consult-cal__dot--completed',
};
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function buildCalendarDays(year, month) {
  const first = new Date(year, month - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
}
export default function ConsultationsTab() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');
  const canCreateMeeting = isAdmin || isLawyer;
  const [view, setView] = useState(() => new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDate, setCreateDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const year = view.getFullYear();
  const month = view.getMonth() + 1;
  const monthStr = monthKey(view);
  useEffect(() => {
    setLoading(true);
    const params = { month: monthStr };
    if (statusFilter) params.status = statusFilter;
    getMeetings(params)
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, [monthStr, statusFilter, refreshKey]);
  const byDay = useMemo(() => {
    const map = {};
    meetings.forEach((m) => {
      const k = new Date(m.start_at).toISOString().slice(0, 10);
 
      if (!map[k]) map[k] = [];
      map[k].push(m);
    });
    return map;
  }, [meetings]);
  const pending = meetings.filter((m) => m.status === 'pending');
  const completed = meetings.filter((m) => m.status === 'completed');
  const selectedMeetings = selectedDay
    ? (byDay[`${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`] || []).filter(
        (m) => !['pending', 'completed'].includes(m.status),
      )
    : [];
  const handleConfirm = async (meetingId) => {
    await confirmMeeting(meetingId);
    setRefreshKey((k) => k + 1);
  };
  const handleCancel = async (meetingId) => {
    await cancelMeeting(meetingId, '');
    setRefreshKey((k) => k + 1);
  };
  const renderMeetingActions = (meeting) => {
    const isClient = meeting.request?.client_id === user?.id;
    if (!isClient) return null;
    return (
      <>
        {meeting.status === 'pending' && (
          <button type="button" className="meeting-form__btn meeting-form__btn--primary" onClick={() => handleConfirm(meeting.id)}>
            Подтвердить
          </button>
        )}
        {['pending', 'confirmed'].includes(meeting.status) && (
          <button type="button" className="meeting-form__btn meeting-form__btn--ghost" onClick={() => handleCancel(meeting.id)}>
            Отменить
          </button>
        )}
      </>
    );
  };
  const cells = buildCalendarDays(year, month);
  const monthLabel = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  return (
    <div className="consultations-tab">
      {isAdmin && (
        <div className="consultations-tab__filters">
          <label>
            Статус
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="consultations-tab__select">
              <option value="">Все</option>
              <option value="pending">Ожидает</option>
              <option value="confirmed">Подтверждена</option>
              <option value="cancelled">Отменена</option>
              <option value="completed">Завершена</option>
            </select>
          </label>
        </div>
      )}
      <div className="consultations-tab__grid">
        <div className="consultations-tab__calendar-block">
          <div className="consult-cal__nav">
            <button type="button" onClick={() => setView(new Date(year, month - 2, 1))}>‹</button>
            <span>{monthLabel}</span>
            <button type="button" onClick={() => setView(new Date(year, month, 1))}>›</button>
          </div>
          <div className="consult-cal__weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="consult-cal__cells">
            {cells.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} className="consult-cal__cell consult-cal__cell--empty" />;
              const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayMeetings = byDay[key] || [];
              const isSelected = selectedDay === day;
              return (
                <button
                  key={key}
                  type="button"
                  className={`consult-cal__cell${isSelected ? ' consult-cal__cell--selected' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="consult-cal__day-num">{day}</span>
                  <span className="consult-cal__dots">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <span key={m.id} className={`consult-cal__dot ${STATUS_DOT[m.status] || ''}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <div className="consult-cal__day-list">
              <div className="consult-cal__day-list-head">
                <h3>Консультации на {selectedDay}.{month}</h3>
                {canCreateMeeting && (
                  <button
                    type="button"
                    className="consult-cal__create-btn"
                    onClick={() => {
                      setCreateDate({ year, month, day: selectedDay });
                      setCreateModalOpen(true);
                    }}
                  >
                    + Консультация
                  </button>
                )}
              </div>
              {selectedMeetings.length === 0 ? (
                <p>Нет консультаций в этот день.</p>
              ) : (
                selectedMeetings.map((m) => <MeetingCard key={m.id} meeting={m} actions={renderMeetingActions(m)} />)
              )}
            </div>
          )}
        </div>
        <div className="consultations-tab__aside">
          <h3 className="consultations-tab__aside-title">Ожидающие подтверждения</h3>
          {loading && <p>Загрузка…</p>}
          {!loading && pending.length === 0 && <p>Нет консультаций, ожидающих подтверждения.</p>}
          {pending.map((m) => (
            <MeetingCard key={m.id} meeting={m} actions={renderMeetingActions(m)} />
          ))}
        </div>
      </div>
      <section className="consultations-tab__completed">
        <h3>Завершенные консультации</h3>
        {completed.length === 0 ? (
          <p>Нет завершённых консультаций за выбранный период.</p>
        ) : (
          <div className="consultations-tab__completed-grid">
            {completed.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </section>
      <MeetingCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDate={createDate}
        onCreated={() => {
          setCreateModalOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}