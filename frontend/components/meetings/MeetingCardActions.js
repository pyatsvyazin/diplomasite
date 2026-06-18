import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  cancelMeeting,
  completeMeeting,
  confirmMeeting,
  updateMeeting,
} from '../../lib/api';
import ModalShell from '../ModalShell';
import MeetingForm, { toLocalInputValue } from './MeetingForm';

export default function MeetingCardActions({ meeting, onUpdated }) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');
  const isStaff = isAdmin || isLawyer;
  const isClient = meeting.request?.client_id === user?.id;
  const isActive = ['pending', 'confirmed'].includes(meeting.status);
  const canConfirmClient = isClient && meeting.status === 'pending' && new Date(meeting.start_at) >= new Date();

  const refresh = () => onUpdated?.();

  const runAction = async (action, errorMessage) => {
    try {
      await action();
      refresh();
    } catch (e) {
      window.alert(e?.message || errorMessage);
    }
  };

  const handleCancel = () => {
    const reason = window.prompt('Причина отмены (необязательно)') || '';
    runAction(() => cancelMeeting(meeting.id, reason), 'Не удалось отменить консультацию');
  };

  const handleUpdate = async (payload) => {
    await updateMeeting(meeting.id, payload);
    setEditOpen(false);
    refresh();
  };

  if (!canConfirmClient && !(isActive && (isClient || isStaff))) {
    return null;
  }

  return (
    <>
      {canConfirmClient && (
        <button
          type="button"
          className="meeting-form__btn meeting-form__btn--primary"
          onClick={() => runAction(() => confirmMeeting(meeting.id), 'Не удалось подтвердить консультацию')}
        >
          Подтвердить
        </button>
      )}

      {isActive && (isClient || isStaff) && (
        <button type="button" className="meeting-form__btn meeting-form__btn--ghost" onClick={handleCancel}>
          Отменить
        </button>
      )}

      {isActive && isStaff && (
        <>
          <button
            type="button"
            className="meeting-form__btn meeting-form__btn--ghost"
            onClick={() => setEditOpen(true)}
          >
            Изменить
          </button>
          <button
            type="button"
            className="meeting-form__btn meeting-form__btn--primary"
            onClick={() => runAction(() => completeMeeting(meeting.id), 'Не удалось завершить консультацию')}
          >
            Завершить
          </button>
        </>
      )}

      {editOpen && (
        <ModalShell open onClose={() => setEditOpen(false)} overlayClassName="meeting-modal-overlay">
          <div
            className="meeting-modal"
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="meeting-modal__close"
              onClick={() => setEditOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
            <h2 className="meeting-modal__title">Изменить консультацию</h2>
            <MeetingForm
              showLawyerSelect={isAdmin}
              submitLabel="Сохранить"
              initial={{
                title: meeting.title,
                description: meeting.description || '',
                meeting_type: meeting.meeting_type,
                start_at: toLocalInputValue(meeting.start_at),
                end_at: toLocalInputValue(meeting.end_at),
                location: meeting.location || '',
                meeting_link: meeting.meeting_link || '',
                responsible_lawyer_id: meeting.responsible_lawyer_id
                  ? String(meeting.responsible_lawyer_id)
                  : '',
              }}
              onCancel={() => setEditOpen(false)}
              onSubmit={handleUpdate}
            />
          </div>
        </ModalShell>
      )}
    </>
  );
}
