import { useEffect, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';

export default function LawyerFilterCombobox({ lawyers, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);

  const selected = lawyers.find((l) => String(l.id) === String(value));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  const filtered = lawyers.filter((l) => {
    if (!query.trim()) return true;
    return (l.full_name || '').toLowerCase().includes(query.trim().toLowerCase());
  });

  const displayValue = open ? query : selected?.full_name || '';

  return (
    <div className="lawyer-filter" ref={boxRef}>
      <input
        type="text"
        className="reviews-page__select lawyer-filter__input"
        placeholder="Все юристы"
        value={displayValue}
        disabled={disabled}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.full_name || '');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange('');
        }}
      />
      {open && !disabled && (
        <ul className="lawyer-filter__list" role="listbox">
          <li>
            <button
              type="button"
              className="lawyer-filter__option"
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
              }}
            >
              Все юристы
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="lawyer-filter__empty">Нет совпадений</li>
          ) : (
            filtered.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="lawyer-filter__option"
                  onClick={() => {
                    onChange(String(l.id));
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  <Avatar
                    name={l.full_name}
                    src={getAvatarUrl(l.avatar_path)}
                    size={28}
                    className="lawyer-filter__avatar"
                  />
                  <span>{l.full_name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
