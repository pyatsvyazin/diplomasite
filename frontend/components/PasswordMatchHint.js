/**
 * Индикатор совпадения пароля и подтверждения (чип, как у правил пароля).
 */
export default function PasswordMatchHint({ password, confirmation, className = '' }) {
  const hasConfirm = (confirmation || '').length > 0;
  const ok = hasConfirm && password === confirmation;

  return (
    <ul className={`password-rules${className ? ` ${className}` : ''}`} aria-live="polite">
      <li className={`password-rules__item${ok ? ' password-rules__item--ok' : ''}`}>
        <span className="password-rules__icon" aria-hidden>
          {ok ? '✓' : '○'}
        </span>
        <span>Пароли совпадают</span>
      </li>
    </ul>
  );
}
