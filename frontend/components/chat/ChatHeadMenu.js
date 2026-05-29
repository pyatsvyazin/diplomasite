import { useEffect, useRef, useState } from 'react';

export default function ChatHeadMenu({ onConsultation, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  if (disabled) return null;

  return (
    <div className="chat-head-menu" ref={ref}>
      <button
        type="button"
        className="chat-head-menu__trigger"
        aria-label="Действия"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <ul className="chat-head-menu__dropdown" role="menu">
          <li role="none">
            <button
              type="button"
              className="chat-head-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onConsultation?.();
              }}
            >
              Консультация
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
