import { useEffect } from 'react';

/** Блокирует прокрутку страницы, пока открыта модалка. */
const HTML_MODAL_CLASS = 'app-modal-open';

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const html = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const prevHtmlPadding = html.style.paddingRight;
    const scrollbar = window.innerWidth - html.clientWidth;
    html.classList.add(HTML_MODAL_CLASS);
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) {
      const pad = `${scrollbar}px`;
      document.body.style.paddingRight = pad;
      html.style.paddingRight = pad;
    }
    return () => {
      html.classList.remove(HTML_MODAL_CLASS);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      html.style.paddingRight = prevHtmlPadding;
    };
  }, [active]);
}
