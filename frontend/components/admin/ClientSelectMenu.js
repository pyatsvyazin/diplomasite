import { useState, useEffect, useRef } from 'react';
import { getAdminUsers, updateAdminRequest } from '../../lib/api';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';
import { notifyAdminRequestUpdated } from '../../lib/adminEvents';

export default function ClientSelectMenu({ requestId, onSelect, onClose, renderTrigger }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAdminUsers(search, 'client')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open, onClose]);

  const handlePick = (user) => {
    updateAdminRequest(requestId, { client_id: user.id })
      .then((updated) => {
        onSelect?.(updated);
        notifyAdminRequestUpdated(updated);
        setOpen(false);
        onClose?.();
      });
  };

  return (
    <div className="lawyer-select client-select" ref={boxRef}>
      {renderTrigger(() => setOpen((v) => !v))}
      {open && (
        <div className="lawyer-select__menu">
          <input
            type="search"
            className="lawyer-select__search"
            placeholder="Поиск по имени, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="lawyer-select__list">
            {loading ? (
              <div className="lawyer-select__loading">Загрузка...</div>
            ) : users.length === 0 ? (
              <div className="lawyer-select__empty">Нет пользователей</div>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="lawyer-select__item"
                  onClick={() => handlePick(u)}
                >
                  <Avatar name={u.full_name} size={32} className="lawyer-select__item-avatar" src={getAvatarUrl(u)} />
                  <span className="lawyer-select__item-name">{u.full_name}</span>
                  {u.email && (
                    <span className="client-select__item-email">{u.email}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}