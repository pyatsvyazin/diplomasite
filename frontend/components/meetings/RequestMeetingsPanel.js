import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import {

  cancelMeeting,

  completeMeeting,

  confirmMeeting,

  getRequestMeetings,

  updateMeeting,

} from '../../lib/api';

import MeetingCard from './MeetingCard';

import MeetingCreateModal from './MeetingCreateModal';
import ModalShell from '../ModalShell';

import MeetingForm, { toLocalInputValue } from './MeetingForm';



export default function RequestMeetingsPanel({

  requestId,

  request,

  showCreateButton = false,

  onOpenCreateModal,

}) {

  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [editMeeting, setEditMeeting] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);



  const isAdmin = user?.roles?.some((r) => r.name === 'admin');

  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');

  const isClient = request?.client_id === user?.id;

  const canCreate = (isAdmin || isLawyer) && request?.lawyer_id && !['closed', 'rejected'].includes(request?.status);



  const load = useCallback(() => {

    if (!requestId) return;

    setLoading(true);

    getRequestMeetings(requestId)

      .then(setMeetings)

      .catch(() => setMeetings([]))

      .finally(() => setLoading(false));

  }, [requestId]);



  useEffect(() => {

    load();

  }, [load]);



  const openCreate = () => {

    if (onOpenCreateModal) {

      onOpenCreateModal();

      return;

    }

    setCreateModalOpen(true);

  };



  const handleUpdate = async (payload) => {

    await updateMeeting(editMeeting.id, payload);

    setEditMeeting(null);

    setEditModalOpen(false);

    load();

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

              actions={

                <>

                  {isClient && m.status === 'pending' && new Date(m.start_at) >= new Date() && (

                    <button type="button" className="meeting-form__btn meeting-form__btn--primary" onClick={() => confirmMeeting(m.id).then(load)}>

                      Подтвердить

                    </button>

                  )}

                  {(isClient || isLawyer || isAdmin) && ['pending', 'confirmed'].includes(m.status) && (

                    <button

                      type="button"

                      className="meeting-form__btn meeting-form__btn--ghost"

                      onClick={() => {

                        const reason = window.prompt('Причина отмены (необязательно)') || '';

                        cancelMeeting(m.id, reason).then(load);

                      }}

                    >

                      Отменить

                    </button>

                  )}

                  {(isLawyer || isAdmin) && ['pending', 'confirmed'].includes(m.status) && (

                    <>

                      <button

                        type="button"

                        className="meeting-form__btn meeting-form__btn--ghost"

                        onClick={() => {

                          setEditMeeting(m);

                          setEditModalOpen(true);

                        }}

                      >

                        Изменить

                      </button>

                      <button type="button" className="meeting-form__btn meeting-form__btn--primary" onClick={() => completeMeeting(m.id).then(load)}>

                        Завершить

                      </button>

                    </>

                  )}

                </>

              }

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

        onCreated={load}

      />



      {editModalOpen && editMeeting && (
        <ModalShell open onClose={() => setEditModalOpen(false)} overlayClassName="meeting-modal-overlay">
          <div
            className="meeting-modal"
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >

            <button type="button" className="meeting-modal__close" onClick={() => setEditModalOpen(false)} aria-label="Закрыть">

              ×

            </button>

            <h2 className="meeting-modal__title">Изменить консультацию</h2>

            <MeetingForm

              showLawyerSelect={isAdmin}

              submitLabel="Сохранить"

              initial={{

                title: editMeeting.title,

                description: editMeeting.description || '',

                meeting_type: editMeeting.meeting_type,

                start_at: toLocalInputValue(editMeeting.start_at),

                end_at: toLocalInputValue(editMeeting.end_at),

                location: editMeeting.location || '',

                meeting_link: editMeeting.meeting_link || '',

                responsible_lawyer_id: editMeeting.responsible_lawyer_id ? String(editMeeting.responsible_lawyer_id) : '',

              }}

              onCancel={() => setEditModalOpen(false)}

              onSubmit={handleUpdate}

            />

          </div>
        </ModalShell>
      )}

    </section>

  );

}

