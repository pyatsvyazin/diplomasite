import { useState, useEffect, useRef } from 'react';
import { getAdminLawyers, updateAdminRequest } from '../../lib/api';
import Avatar from '../Avatar';

export default function LawyerSelectMenu({ requestId, onSelect, renderTrigger }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAdminLawyers(search)
      .then(setLawyers)
      .catch(() => setLawyers([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handlePick = (lawyer) => {
    updateAdminRequest(requestId, { lawyer_id: lawyer.id, status: 'in_progress' })
      .then(() => {
        onSelect?.();
        setOpen(false);
      })
      .catch((err) => {
        window.alert(err?.message || 'Не удалось назначить юриста');
      });
  };

  return (
    <div className="lawyer-select" ref={boxRef}>
      {renderTrigger(() => setOpen((v) => !v))}
      {open && (
        <div className="lawyer-select__menu">
          <input
            type="search"
            className="lawyer-select__search"
            placeholder="Поиск юриста..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="lawyer-select__list">
            {loading ? (
              <div className="lawyer-select__loading">Загрузка...</div>
            ) : lawyers.length === 0 ? (
              <div className="lawyer-select__empty">Нет юристов</div>
            ) : (
              lawyers.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="lawyer-select__item"
                  onClick={() => handlePick(l)}
                >
                  <Avatar name={l.full_name} size={32} className="lawyer-select__item-avatar" />
                  <span className="lawyer-select__item-name">{l.full_name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}