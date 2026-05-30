import Link from 'next/link';

const STATUS_CLASS = {
  pending: 'meeting-card--pending',
  confirmed: 'meeting-card--confirmed',
  cancelled: 'meeting-card--cancelled',
  completed: 'meeting-card--completed',
  overdue: 'meeting-card--overdue',
};

function formatShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MeetingCard({ meeting, actions }) {
  const displayStatus = meeting.status === 'pending' && new Date(meeting.start_at) < new Date() ? 'overdue' : meeting.status;
  const statusClass = STATUS_CLASS[displayStatus] || '';
  const place = meeting.meeting_type === 'online' ? meeting.meeting_link : meeting.location;

  return (
    <article className={`meeting-card ${statusClass}`}>
      <div className="meeting-card__head">
        <span className="meeting-card__date">{formatShort(meeting.start_at)}</span>
      </div>

      <h3 className="meeting-card__title">{meeting.title}</h3>
      {meeting.description && <p className="meeting-card__desc">{meeting.description}</p>}
      <p className="meeting-card__meta">
        {meeting.meeting_type === 'online' ? 'Онлайн' : 'Очная'}
        {place ? ` · ${place}` : ''}
      </p>
      {meeting.responsible_lawyer && (
        <p className="meeting-card__lawyer">Юрист: {meeting.responsible_lawyer.full_name}</p>
      )}

      {actions && <div className="meeting-card__actions">{actions}</div>}
    </article>
  );
}
