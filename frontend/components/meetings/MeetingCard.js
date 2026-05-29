import Link from 'next/link';

const STATUS_CLASS = {
  pending: 'meeting-card--pending',
  confirmed: 'meeting-card--confirmed',
  cancelled: 'meeting-card--cancelled',
  completed: 'meeting-card--completed',
};

function formatShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MeetingCard({ meeting, actions }) {
  const statusClass = STATUS_CLASS[meeting.status] || '';
  const place = meeting.meeting_type === 'online' ? meeting.meeting_link : meeting.location;

  return (
    <article className={`meeting-card ${statusClass}`}>
      <div className="meeting-card__head">
        <span className="meeting-card__date">{formatShort(meeting.start_at)}</span>
        <span className="meeting-card__status">{meeting.formatted_status || meeting.status}</span>
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
      {meeting.request_id && (
        <Link href={`/requests/${meeting.request_id}/chat`} className="meeting-card__link">
          Открыть чат заявки
        </Link>
      )}
      {actions && <div className="meeting-card__actions">{actions}</div>}
    </article>
  );
}
