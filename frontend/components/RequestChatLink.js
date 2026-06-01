import Link from 'next/link';

/** Иконка перехода в чат заявки (как у консультаций). */
export default function RequestChatLink({ requestId, className = '' }) {
  if (!requestId) return null;

  return (
    <Link
      href={`/requests/${requestId}/chat`}
      className={`request-chat-link${className ? ` ${className}` : ''}`}
      title="Чат по заявке"
      aria-label="Открыть чат"
    >
      <img src="/icons/chat.svg" alt="" width={18} height={18} />
    </Link>
  );
}
