import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  overdue: 'consult-cal__dot--overdue',
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

function sortByStartAsc(a, b) {
  return new Date(a.start_at) - new Date(b.start_at);
}

function sortByStartDesc(a, b) {
  return new Date(b.start_at) - new Date(a.start_at);
}

function formatFullRussianDate(year, month, day) {
  return new Date(year, month - 1, day)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', ' года');
}

function formatNearestDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPastMeeting(meeting) {
  return new Date(meeting.start_at) < new Date();
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
  const [nearestMaxHeight, setNearestMaxHeight] = useState(null);
  const calendarRef = useRef(null);
  const year = view.getFullYear();
  const month = view.getMonth() + 1;
  const monthStr = monthKey(view);

  useEffect(() => {
    setLoading(true);
    const params = { month: monthStr };
    if (statusFilter) params.status = statusFilter;
    if (isLawyer) params.lawyer_id = user?.id;
    getMeetings(params)
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, [monthStr, statusFilter, refreshKey, isLawyer, user?.id]);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (calendarRef.current) {
        setNearestMaxHeight(calendarRef.current.offsetHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (calendarRef.current) resizeObserver.observe(calendarRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [monthStr, meetings, selectedDay]);

  const byDay = useMemo(() => {
    const map = {};
    meetings.forEach((m) => {
      const k = new Date(m.start_at).toISOString().slice(0, 10);

      if (!map[k]) map[k] = [];
      map[k].push(m);
    });
    Object.values(map).forEach((items) => items.sort(sortByStartAsc));
    return map;
  }, [meetings]);

  const now = new Date();
  const pending = useMemo(
    () => meetings.filter((m) => m.status === 'pending' && new Date(m.start_at) >= now).sort(sortByStartAsc),
    [meetings, now],
  );
  const confirmedPast = useMemo(
    () => meetings.filter((m) => m.status === 'confirmed' && new Date(m.start_at) < now).sort(sortByStartAsc),
    [meetings, now],
  );
  const completed = useMemo(
    () =>
      meetings
        .filter((m) => ['completed', 'cancelled'].includes(m.status) || (m.status === 'pending' && new Date(m.start_at) < now))
        .sort(sortByStartDesc),
    [meetings, now],
  );
  const nearestMeetings = useMemo(() => {
    return meetings
      .filter((m) => m.status === 'confirmed' && new Date(m.start_at) >= now)
      .sort(sortByStartAsc);
  }, [meetings, now]);
  const selectedMeetings = selectedDay
    ? byDay[`${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`] || []
    : [];
  const selectedDateLabel = selectedDay ? formatFullRussianDate(year, month, selectedDay) : '';

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
    const isOverdue = meeting.status === 'pending' && new Date(meeting.start_at) < new Date();
    if (!isClient) return null;
    return (
      <>
        {meeting.status === 'pending' && !isOverdue && (
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
              <option value="overdue">Просрочена</option>
              <option value="completed">Завершена</option>
            </select>
          </label>
        </div>
      )}
      <div className="consultations-tab__main-layout" style={{ alignItems: 'stretch', minHeight: 0 }}>
        <div className="consultations-tab__calendar-block" ref={calendarRef} style={{ minHeight: 0 }}>
            <div className="consult-cal__nav">
              <button
                type="button"
                onClick={() => {
                  setView(new Date(year, month - 2, 1));
                  setSelectedDay(null);
                }}
              >
                ‹
              </button>
              <span>{monthLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setView(new Date(year, month, 1));
                  setSelectedDay(null);
                }}
              >
                ›
              </button>
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
                    onClick={() => setSelectedDay((current) => (current === day ? null : day))}
                  >
                    <span className="consult-cal__day-num">{day}</span>
                    <span className="consult-cal__dots">
                      {dayMeetings.map((m) => {
                        const dotStatus = m.status === 'pending' && isPastMeeting(m) ? 'overdue' : m.status;
                        return <span key={m.id} className={`consult-cal__dot ${STATUS_DOT[dotStatus] || ''}`} />;
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        <aside
          className="consultations-tab__nearest"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            height: '100%',
            maxHeight: nearestMaxHeight ? `${nearestMaxHeight}px` : undefined,
            overflow: 'hidden',
          }}
        >
          <h3 className="consultations-tab__section-title">Ближайшие консультации</h3>
          <div
            className="consultations-tab__nearest-grid"
            style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
          >
            {loading && <p className="consultations-tab__empty">Загрузка…</p>}
            {!loading && nearestMeetings.length === 0 && <p className="consultations-tab__empty">Нет ближайших консультаций.</p>}
            {nearestMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} actions={renderMeetingActions(meeting)} />
            ))}
          </div>
        </aside>
      </div>

      <div className="consultations-tab__sections">
        {pending.length > 0 && (
          <section className="consultations-tab__section">
            <h3 className="consultations-tab__section-title">Ожидающие подтверждения</h3>
            <div className="consultations-tab__cards-grid consultations-tab__cards-grid--single">
              {pending.map((m) => (
                <MeetingCard key={m.id} meeting={m} actions={renderMeetingActions(m)} />
              ))}
            </div>
          </section>
        )}

        {confirmedPast.length > 0 && (
          <section className="consultations-tab__section">
            <h3 className="consultations-tab__section-title">Подтверждённые консультации</h3>
            <div className="consultations-tab__cards-grid">
              {confirmedPast.map((m) => (
                <MeetingCard key={m.id} meeting={m} actions={renderMeetingActions(m)} />
              ))}
            </div>
          </section>
        )}

        {selectedDay && selectedMeetings.length > 0 && (
          <section className="consultations-tab__section">
            <div className="consultations-tab__section-head">
              <h3 className="consultations-tab__section-title">Консультации на {selectedDateLabel}</h3>
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
            <div className="consultations-tab__cards-grid">
              {selectedMeetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} actions={renderMeetingActions(m)} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="consultations-tab__section">
            <h3 className="consultations-tab__section-title">Завершенные консультации</h3>
            <div className="consultations-tab__cards-grid">
              {completed.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          </section>
        )}
      </div>

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
