import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createRequestMeeting, getAdminRequests } from '../../lib/api';
import ModalShell from '../ModalShell';
import MeetingForm, { toLocalInputValue } from './MeetingForm';
import { notifyAdminMeetingUpdated } from '../../lib/adminEvents';

function defaultStartFromDate(year, month, day) {
  const d = new Date(year, month - 1, day, 10, 0, 0, 0);
  const end = new Date(year, month - 1, day, 11, 0, 0, 0);
  return {
    start_at: toLocalInputValue(d.toISOString()),
    end_at: toLocalInputValue(end.toISOString()),
  };
}

export default function MeetingCreateModal({
  open,
  onClose,
  requestId: fixedRequestId,
  request: fixedRequest,
  initialDate,
  onCreated,
}) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');
  const [requestId, setRequestId] = useState(fixedRequestId ? String(fixedRequestId) : '');
  const [request, setRequest] = useState(fixedRequest || null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setRequestId(fixedRequestId ? String(fixedRequestId) : '');
    setRequest(fixedRequest || null);
    setError('');
  }, [open, fixedRequestId, fixedRequest]);

  useEffect(() => {
    if (!open || fixedRequestId) return;
    setLoadingRequests(true);
    getAdminRequests('', 1, 1000)
      .then(({ data: list }) => {
        let eligible = (list || []).filter(
          (r) => r.lawyer_id && !['closed', 'rejected'].includes(r.status),
        );
        if (isLawyer && !isAdmin) {
          eligible = eligible.filter((r) => Number(r.lawyer_id) === Number(user?.id));
        }
        setRequests(eligible);
        setRequestId((current) => {
          if (!current) return '';
          return eligible.some((r) => String(r.id) === current) ? current : '';
        });
        setRequest((current) => {
          if (!current) return null;
          return eligible.some((r) => r.id === current.id) ? current : null;
        });
      })
      .catch(() => setRequests([]))
      .finally(() => setLoadingRequests(false));
  }, [open, fixedRequestId, isLawyer, isAdmin, user?.id]);

  const formInitial = useMemo(() => {
    const base = { title: 'Консультация' };
    if (initialDate?.year != null && initialDate?.month != null && initialDate?.day != null) {
      return {
        ...base,
        ...defaultStartFromDate(initialDate.year, initialDate.month, initialDate.day),
      };
    }
    return base;
  }, [initialDate, open]);

  const handleRequestChange = (e) => {
    const id = e.target.value;
    setRequestId(id);
    const found = requests.find((r) => String(r.id) === id);
    setRequest(found || null);
    setError('');
  };

  const handleSubmit = async (payload) => {
    const rid = fixedRequestId || Number(requestId);
    if (!rid) {
      setError('Выберите заявку');
      throw new Error('Выберите заявку');
    }
    const created = await createRequestMeeting(rid, payload);
    notifyAdminMeetingUpdated({
      action: 'created',
      request_id: rid,
      meeting_id: created?.id,
    });
    onCreated?.();
    onClose();
  };

  const activeRequest = fixedRequest || request;
  const canSubmit = fixedRequestId || requestId;
  const noLawyer = activeRequest && !activeRequest.lawyer_id;

  return (
    <ModalShell open={open} onClose={onClose} overlayClassName="meeting-modal-overlay">
      <div
        className="meeting-modal"
        role="dialog"
        aria-labelledby="meeting-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="meeting-modal__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="meeting-modal-title" className="meeting-modal__title">
          Назначить консультацию
        </h2>
        {!fixedRequestId && (
          <label className="meeting-modal__label">
            Заявка
            <select
              className="meeting-modal__select"
              value={requestId}
              onChange={handleRequestChange}
              disabled={loadingRequests || requests.length === 0}
            >
              <option value="">
                {loadingRequests
                  ? 'Загрузка…'
                  : requests.length === 0
                    ? '— нет доступных заявок —'
                    : '— выберите заявку —'}
              </option>
              {requests.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  №{r.id} — {r.subject || 'Без темы'}
                </option>
              ))}
            </select>
          </label>
        )}
        {!fixedRequestId && !loadingRequests && requests.length === 0 && isLawyer && !isAdmin && (
          <p className="meeting-modal__hint">Нет активных заявок, где вы назначены ответственным юристом.</p>
        )}
        {fixedRequest && (
          <p className="meeting-modal__hint">
            Заявка №{fixedRequest.id}: {fixedRequest.subject || 'Без темы'}
          </p>
        )}
        {noLawyer && (
          <p className="meeting-modal__warn">Сначала назначьте ответственного юриста по заявке.</p>
        )}
        {error && <p className="meeting-modal__error">{error}</p>}
        {canSubmit && !noLawyer && (
          <MeetingForm
            showLawyerSelect={isAdmin}
            submitLabel="Создать"
            initial={formInitial}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </ModalShell>
  );
}
