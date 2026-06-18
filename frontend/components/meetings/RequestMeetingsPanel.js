import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import { getRequestMeetings } from '../../lib/api';

import MeetingCard from './MeetingCard';

import MeetingCreateModal from './MeetingCreateModal';
import MeetingCardActions from './MeetingCardActions';
import { ADMIN_MEETING_UPDATED_EVENT } from '../../lib/adminEvents';

export default function RequestMeetingsPanel({
  requestId,
  request,
  showCreateButton = false,
  onOpenCreateModal,
}) {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const isAdmin = user?.roles?.some((r) => r.name === 'admin');

  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');

  const canCreate = (isAdmin || isLawyer) && request?.lawyer_id && !['closed', 'rejected'].includes(request?.status);

  const load = useCallback((silent = false) => {
    if (!requestId) return;
    if (!silent) setLoading(true);
    getRequestMeetings(requestId)
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onMeeting = (e) => {
      if (Number(e.detail?.request_id) === Number(requestId)) {
        load(true);
      }
    };
    window.addEventListener(ADMIN_MEETING_UPDATED_EVENT, onMeeting);
    return () => window.removeEventListener(ADMIN_MEETING_UPDATED_EVENT, onMeeting);
  }, [requestId, load]);

  const openCreate = () => {
    if (onOpenCreateModal) {
      onOpenCreateModal();
      return;
    }

    setCreateModalOpen(true);
  };

  if (!requestId) return null;

  return (
    <section className="request-meetings">
      <div className="request-meetings__head">
        <h2 className="request-meetings__title">Консультации</h2>

        {showCreateButton && canCreate && (
          <button type="button" className="request-meetings__add" onClick={openCreate} title="Назначить консультацию">
            <span className="request-meetings__add-text">Назначить консультацию</span>
            <span className="request-meetings__add-icon" aria-hidden>+</span>
          </button>
        )}
      </div>

      {!request?.lawyer_id && (isAdmin || isLawyer) && (
        <p className="request-meetings__hint">Сначала назначьте ответственного юриста по заявке.</p>
      )}

      {loading && <p>Загрузка…</p>}

      {!loading && meetings.length === 0 && <p className="request-meetings__empty">Консультаций пока нет.</p>}

      <div className="request-meetings__list-wrap">
        <ul className="request-meetings__list">
          {meetings.map((m) => (
            <li key={m.id}>
              <MeetingCard
                meeting={m}
                actions={<MeetingCardActions meeting={m} onUpdated={() => load(true)} />}
              />
            </li>
          ))}
        </ul>
      </div>

      <MeetingCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        requestId={requestId}
        request={request}
        onCreated={() => load(true)}
      />
    </section>
  );
}
