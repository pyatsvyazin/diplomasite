import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

/**
 * Общая оболочка модалки: блокировка скролла страницы.
 * Закрытие — только через крестик / «Отмена» / успешное действие (onClose снаружи).
 */
export default function ModalShell({ open, onClose, overlayClassName = 'staff-modal-overlay', children }) {
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={overlayClassName} role="presentation">
      {children}
    </div>,
    document.body,
  );
}
