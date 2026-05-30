import Link from 'next/link';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { useAuth } from '../../context/AuthContext';
import {
  deleteConversationMessage,
  downloadChatAttachment,
  getConversationByRequestId,
  getConversationMessages,
  getAvatarUrl,
  patchConversationMessage,
  getPublicStorageUrl,
  postConversationFileMessage,
  postConversationRead,
  postConversationTextMessage,
} from '../../lib/api';
import { getEcho } from '../../lib/echo';
import { notifyChatsListRefresh } from '../../lib/chatsEvents';
import ChatHeadMenu from './ChatHeadMenu';
import MeetingCreateModal from '../meetings/MeetingCreateModal';

/** Время внутри пузыря (как в мессенджерах) — только часы:минуты */
function formatBubbleTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function dayKeyFromIso(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Подпись дня между сообщениями (например «4 мая») */
function formatDaySeparator(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const opts = { day: 'numeric', month: 'long' };
  if (d.getFullYear() !== now.getFullYear()) {
    return d.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' });
  }
  return d.toLocaleDateString('ru-RU', opts);
}

function isThreadNearBottom(el, thresholdPx = 72) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
}

function formatFileSize(bytes) {
  if (bytes == null || bytes === 0) return '0 Б';
  const u = ['Б', 'КБ', 'МБ', 'ГБ'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`;
}

/** Снимает префикс ответа `> имя · время / > фрагмент`, если есть */
function parseReplyQuoteFromContent(content) {
  if (!content || typeof content !== 'string') {
    return { body: content || '', quote: null };
  }
  const m = content.match(/^>([^\n]+)\n>([^\n]*)\n\n([\s\S]*)$/);
  if (!m) {
    return { body: content, quote: null };
  }
  const first = m[1].trim();
  const snippet = m[2].trim();
  const body = m[3];
  const sep = first.indexOf(' · ');
  let authorName = first;
  let quotedTime = '';
  if (sep !== -1) {
    authorName = first.slice(0, sep).trim();
    quotedTime = first.slice(sep + 3).trim();
  }
  return {
    body,
    quote: {
      authorName: authorName || 'Участник',
      snippet: snippet || '…',
      time: quotedTime,
    },
  };
}

function getMessageQuoteSnippet(m) {
  if (m.type === 'system') return (m.content || '').trim();
  if (m.type === 'text') {
    const p = parseReplyQuoteFromContent(m.content || '');
    if (p.quote) {
      return (p.body || '').trim() || p.quote.snippet;
    }
    return (m.content || '').trim();
  }
  if (m.type === 'image') {
    const p = parseReplyQuoteFromContent(m.content || '');
    if (p.quote) {
      return (p.body || '').trim() || 'Фотография';
    }
    return 'Фотография';
  }
  if (m.type === 'file') {
    const p = parseReplyQuoteFromContent(m.content || '');
    if (p.quote) {
      return (p.body || '').trim() || m.attachments?.[0]?.file_name || 'Файл';
    }
    return m.attachments?.[0]?.file_name || 'Файл';
  }
  return '';
}

function getReplyPresentation(m) {
  const replyToId = m.reply_to_message_id ?? m.replyToMessageId;
  const replyFk =
    replyToId != null && replyToId !== '' && Number.isFinite(Number(replyToId));
  if (replyFk && !m.reply_to) {
    return {
      body: m.content || '',
      quote: {
        authorName: '',
        snippet: 'Исходное сообщение удалено или недоступно.',
      },
      replyUnavailable: true,
    };
  }
  if (m.reply_to) {
    return {
      body: m.content || '',
      quote: {
        authorName: m.reply_to.sender?.full_name || 'Участник',
        snippet: getMessageQuoteSnippet(m.reply_to) || '…',
      },
    };
  }
  return parseReplyQuoteFromContent(m.content || '');
}

const MESSAGE_MENU_W = 200;
const MESSAGE_MENU_H = 220;

function clampMessageMenuPosition(x, y) {
  if (typeof window === 'undefined') return { x, y };
  const pad = 8;
  const nx = Math.min(Math.max(pad, x), window.innerWidth - MESSAGE_MENU_W - pad);
  const ny = Math.min(Math.max(pad, y), window.innerHeight - MESSAGE_MENU_H - pad);
  return { x: nx, y: ny };
}

/**
 * @param {{ requestId?: string, embedded?: boolean }} props
 * embedded — правая колонка на /chats; без полной шапки навигации.
 */
export default function RequestChatThread({ requestId: id, embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState(null);
  const [meta, setMeta] = useState({ can_send_messages: false });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  /** Открытое меню: fixed-координаты; via=context — скрываем «⋯» у этого сообщения (ПКМ) */
  const [messageMenu, setMessageMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const threadRef = useRef(null);
  const pollRef = useRef(null);
  const composerFileRef = useRef(null);

  const requestStatus = conversation?.request?.status;
  const chatReadOnly =
    !meta.can_send_messages || requestStatus === 'closed' || requestStatus === 'rejected';
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const isLawyer = user?.roles?.some((r) => r.name === 'lawyer');
  const chatRequest = conversation?.request;
  const canScheduleMeeting =
    (isAdmin || isLawyer) &&
    chatRequest?.lawyer_id &&
    !['closed', 'rejected'].includes(chatRequest?.status);

  const scrollThreadBottom = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    const run = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    setTimeout(run, 0);
    setTimeout(run, 80);
    setTimeout(run, 250);
  }, []);

  const loadMessages = useCallback(
    /**
     * @param {'always' | 'ifNearBottom'} scrollMode — если пользователь листает историю, polling не дёргает вниз
     */
    async (conversationId, scrollMode = 'ifNearBottom') => {
      const el = threadRef.current;
      const nearBefore = scrollMode === 'ifNearBottom' ? isThreadNearBottom(el) : true;
      const page = await getConversationMessages(conversationId, { per_page: 80, page: 1 });
      const list = Array.isArray(page.data) ? [...page.data].reverse() : [];
      setMessages(list);
      const shouldScroll = scrollMode === 'always' || nearBefore;
      if (shouldScroll) {
        setTimeout(scrollThreadBottom, 50);
      }
    },
    [scrollThreadBottom],
  );

  const bootstrap = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getConversationByRequestId(id);
      setConversation(res.data);
      setMeta(res.meta || { can_send_messages: false });
      const cid = res.data?.id;
      if (cid) {
        await loadMessages(cid, 'always');
        try {
          await postConversationRead(cid);
        } catch (_) {
          /* админ и др. без markRead — не критично */
        }
        notifyChatsListRefresh();
      }
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [id, loadMessages]);

  useEffect(() => {
    if (!id || authLoading || !user) return;
    bootstrap();
  }, [id, authLoading, user, bootstrap]);

  /**
   * Первый скролл вниз после появления ленты в DOM.
   * Раньше scroll вызывался из loadMessages при loading=true — threadRef ещё не смонтирован, скролл терялся.
   * Зависимости только от loading/id чата — не от messages, чтобы не дёргать скролл при Echo/polling.
   */
  useLayoutEffect(() => {
    if (loading || !conversation?.id) return;
    scrollThreadBottom();
  }, [loading, conversation?.id, scrollThreadBottom]);

  /** Push через Echo + Pusher-протокол (Soketi); иначе — короткий polling при видимой вкладке. */
  useEffect(() => {
    if (!conversation?.id || !user) return;
    const cid = conversation.id;
    const echo = getEcho();
    if (echo) {
      const ch = echo.private(`conversation.${cid}`);
      const onCreated = (payload) => {
        const msg = payload?.message;
        if (!msg) return;
        const el = threadRef.current;
        const nearBefore = isThreadNearBottom(el);
        const own = Number(msg.sender_id) === Number(user?.id);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        notifyChatsListRefresh();
        if (own || nearBefore) {
          setTimeout(scrollThreadBottom, 50);
        }
      };
      ch.listen('.message.created', onCreated);
      return () => {
        ch.stopListening('.message.created', onCreated);
        echo.leave(`conversation.${cid}`);
      };
    }
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      loadMessages(cid).catch(() => {});
    };
    pollRef.current = setInterval(tick, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [conversation?.id, user, loadMessages, scrollThreadBottom]);

  const closeMessageMenu = useCallback(() => {
    setMessageMenu(null);
  }, []);

  useEffect(() => {
    if (!messageMenu) return;
    const onDocMouseDown = (e) => {
      if (
        e.target?.closest?.('.request-chat__msg-menu') ||
        e.target?.closest?.('.request-chat__msg-menu-trigger') ||
        e.target?.closest?.('.request-chat__msg-toolbar-float')
      ) {
        return;
      }
      closeMessageMenu();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [messageMenu, closeMessageMenu]);

  useEffect(() => {
    if (!messageMenu) return;
    if (!messages.some((msg) => msg.id === messageMenu.id)) {
      closeMessageMenu();
    }
  }, [messages, messageMenu, closeMessageMenu]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!conversation || chatReadOnly) return;
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    setSending(true);
    setError('');
    try {
      if (pendingFile) {
        const isImg = /^image\/(jpeg|png)$/i.test(pendingFile.type || '');
        const type = isImg ? 'image' : 'file';
        await postConversationFileMessage(conversation.id, type, pendingFile, trimmed, replyTo?.id || null);
        setPendingFile(null);
      } else {
        await postConversationTextMessage(conversation.id, trimmed, replyTo?.id || null);
      }
      setText('');
      setReplyTo(null);
      await loadMessages(conversation.id, 'always');
      notifyChatsListRefresh();
    } catch (err) {
      setError(err.message || 'Не отправлено');
    } finally {
      setSending(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !conversation || chatReadOnly || sending) return;
    setPendingFile(file);
    setError('');
  };

  const handleStartEdit = (message) => {
    closeMessageMenu();
    setEditingId(message.id);
    setEditingText(message.content || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId) => {
    if (!conversation) return;
    const content = editingText.trim();
    if (!content) {
      setError('Текст сообщения не может быть пустым.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await patchConversationMessage(conversation.id, messageId, content);
      handleCancelEdit();
      await loadMessages(conversation.id, 'ifNearBottom');
      notifyChatsListRefresh();
    } catch (err) {
      setError(err.message || 'Не удалось изменить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!conversation) return;
    closeMessageMenu();
    if (!window.confirm('Удалить это сообщение?')) return;
    setSending(true);
    setError('');
    try {
      await deleteConversationMessage(conversation.id, messageId);
      if (editingId === messageId) handleCancelEdit();
      await loadMessages(conversation.id, 'ifNearBottom');
      notifyChatsListRefresh();
    } catch (err) {
      setError(err.message || 'Не удалось удалить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleCopyMessage = async (m) => {
    closeMessageMenu();
    let payload = '';
    if (m.type === 'text') payload = m.content || '';
    else if (m.type === 'file') payload = m.attachments?.[0]?.file_name || 'Файл';
    else if (m.type === 'image' && m.attachments?.[0]) payload = getPublicStorageUrl(m.attachments[0].file_path);
    else if (m.type === 'image') payload = 'Фотография';
    else payload = m.content || '';
    if (!payload) {
      setError('Нечего копировать.');
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
    } catch (_) {
      setError('Не удалось скопировать в буфер обмена.');
    }
  };

  const handleReplyTo = (m) => {
    closeMessageMenu();
    if (chatReadOnly) return;
    setReplyTo({
      id: m.id,
      authorName: m.sender?.full_name || 'Участник',
      snippet: getMessageQuoteSnippet(m),
    });
  };

  const openMessageMenuFromContext = (m, e) => {
    if (sending) return;
    e.preventDefault();
    const pos = clampMessageMenuPosition(e.clientX, e.clientY);
    setMessageMenu({ id: m.id, x: pos.x, y: pos.y, via: 'context' });
  };

  const toggleMessageMenuFromButton = (m, e) => {
    e.stopPropagation();
    if (sending) return;
    if (messageMenu?.id === m.id) {
      closeMessageMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right - MESSAGE_MENU_W;
    const y = rect.bottom + 6;
    const pos = clampMessageMenuPosition(x, y);
    setMessageMenu({ id: m.id, x: pos.x, y: pos.y, via: 'button' });
  };

  const handleDownload = async (att) => {
    if (!conversation) return;
    try {
      const blob = await downloadChatAttachment(conversation.id, att.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.file_name || 'file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Скачивание не удалось');
    }
  };

  const shellClass = embedded ? 'request-chat request-chat--embedded' : 'page request-chat';
  const visibleMessages = messages;

  if (authLoading) {
    return (
      <div className={shellClass}>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={shellClass}>
        <p>Войдите в аккаунт, чтобы открыть чат.</p>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={`request-chat__head${embedded ? ' request-chat__head--embedded' : ''}`}>
        {!embedded && (
          <div className="request-chat__nav-row">
            <Link href="/profile/profilePage" className="request-chat__back">
              ← К профилю и заявкам
            </Link>
            <Link href="/chats" className="request-chat__back request-chat__back--secondary">
              Все мои чаты
            </Link>
          </div>
        )}
        <div className="request-chat__title-row">
          <h1 className="request-chat__title">
            {embedded ? conversation?.request?.subject || `Заявка #${id}` : `Чат по заявке #${id}`}
          </h1>
          {canScheduleMeeting && (
            <ChatHeadMenu onConsultation={() => setMeetingModalOpen(true)} />
          )}
        </div>
        {!embedded && conversation?.request?.subject && (
          <p className="request-chat__subject">Тема: {conversation.request.subject}</p>
        )}
      </div>

      {loading && <p>Загрузка чата...</p>}
      {error && <p className="request-chat__error">{error}</p>}

      {!loading && conversation && (
        <>
          {chatReadOnly && (
            <div className="request-chat__closed-banner">
              {requestStatus === 'closed' || requestStatus === 'rejected'
                ? 'Чат только для чтения: обращение завершено или отклонено.'
                : 'Отправка сообщений недоступна (нет прав участника чата).'}
            </div>
          )}

          <div className="request-chat__thread" ref={threadRef}>
            {visibleMessages.map((m, idx) => {
              const prev = idx > 0 ? visibleMessages[idx - 1] : null;
              const showDaySep = !prev || dayKeyFromIso(m.created_at) !== dayKeyFromIso(prev.created_at);

              if (m.type === 'system') {
                return (
                  <Fragment key={m.id}>
                    {showDaySep && <div className="request-chat__day-sep">{formatDaySeparator(m.created_at)}</div>}
                    <div className="request-chat__msg request-chat__msg--system">
                      <div className="request-chat__msg--system-body">{m.content}</div>
                      <div className="request-chat__msg--system-foot">
                        <span className="request-chat__bubble-time">{formatBubbleTime(m.created_at)}</span>
                      </div>
                    </div>
                  </Fragment>
                );
              }
              const own = m.sender_id === user.id;
              const userBubble = own ? 'request-chat__msg-user--own' : 'request-chat__msg-user--other';
              const isEditing = editingId === m.id;
              const menuOpen = messageMenu?.id === m.id;
              const hideTriggerForCtx = menuOpen && messageMenu?.via === 'context';
              const parsedReply = getReplyPresentation(m);
              const vkReplyLayout = Boolean(parsedReply.quote);
              return (
                <Fragment key={m.id}>
                  {showDaySep && <div className="request-chat__day-sep">{formatDaySeparator(m.created_at)}</div>}
                  <div
                    className={`request-chat__msg request-chat__msg-user ${userBubble}${
                      vkReplyLayout && !own ? ' request-chat__msg-user--vk-reply' : ''
                    }${vkReplyLayout && own ? ' request-chat__msg-user--vk-reply-own' : ''}${
                      menuOpen ? ' request-chat__msg-user--menu-open' : ''
                    }${hideTriggerForCtx ? ' request-chat__msg-user--ctx-menu' : ''}`}
                  >
                    {!own && m.sender && !vkReplyLayout && (
                      <div className="request-chat__msg-author">{m.sender.full_name || 'Участник'}</div>
                    )}
                    {vkReplyLayout && !own && (
                      <Avatar
                        className="request-chat__msg-avatar"
                        name={m.sender?.full_name}
                        src={getAvatarUrl(m.sender)}
                        size={40}
                        title={m.sender?.full_name}
                      />
                    )}
                    <div
                      className={
                        vkReplyLayout
                          ? 'request-chat__msg-user-col'
                          : 'request-chat__msg-user-col request-chat__msg-user-col--solo'
                      }
                    >
                      <div className="request-chat__msg-stack-vk">
                      {!isEditing && (
                        <div className="request-chat__msg-toolbar-float">
                          <button
                            type="button"
                            className="request-chat__msg-menu-trigger"
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                            aria-label="Действия с сообщением"
                            onClick={(e) => toggleMessageMenuFromButton(m, e)}
                            disabled={sending}
                          >
                            ⋮
                          </button>
                        </div>
                      )}
                      <div
                        className={`request-chat__msg-bubble ${isEditing ? 'request-chat__msg-bubble--editing' : ''}`}
                        onContextMenu={(e) => {
                          if (isEditing || sending) return;
                          openMessageMenuFromContext(m, e);
                        }}
                      >
                        <div className="request-chat__msg-bubble-body">
                          {isEditing ? (
                            <div className="request-chat__edit">
                              <textarea
                                className="request-chat__edit-textarea"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                disabled={sending}
                              />
                              <div className="request-chat__edit-actions">
                                <button type="button" className="request-chat__btn" onClick={() => handleSaveEdit(m.id)} disabled={sending}>
                                  Сохранить
                                </button>
                                <button type="button" className="request-chat__btn" onClick={handleCancelEdit} disabled={sending}>
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="request-chat__bubble-row">
                              <div
                                className={`request-chat__bubble-main${
                                  vkReplyLayout ? ' request-chat__bubble-main--with-reply' : ''
                                }`}
                              >
                                {!isEditing && vkReplyLayout && !own && (
                                  <div className="request-chat__bubble-in-name">{m.sender?.full_name || 'Участник'}</div>
                                )}
                                {!isEditing && vkReplyLayout && (
                                  <div
                                    className={`request-chat__reply-quote${parsedReply.replyUnavailable ? ' request-chat__reply-quote--missing' : ''}`}
                                  >
                                    <div className="request-chat__reply-quote-accent" aria-hidden />
                                    <div className="request-chat__reply-quote-inner">
                                      {parsedReply.replyUnavailable ? (
                                        <div className="request-chat__reply-quote-text request-chat__reply-quote-text--missing">
                                          {parsedReply.quote.snippet}
                                        </div>
                                      ) : (
                                        <>
                                          <div className="request-chat__reply-quote-name">{parsedReply.quote.authorName}</div>
                                          <div className="request-chat__reply-quote-text">{parsedReply.quote.snippet}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {!isEditing && vkReplyLayout && parsedReply.body?.trim() && (
                                  <div className="request-chat__bubble-text request-chat__bubble-text--under-quote">
                                    {parsedReply.body}
                                  </div>
                                )}
                                {!isEditing && !vkReplyLayout && m.type === 'text' && m.content ? (
                                  <div className="request-chat__bubble-text">{m.content}</div>
                                ) : null}
                                {m.type === 'image' && m.attachments?.[0] && (
                                  <img
                                    className="request-chat__inline-img"
                                    src={getPublicStorageUrl(m.attachments[0].file_path)}
                                    alt=""
                                  />
                                )}
                                {m.type === 'file' && m.attachments?.[0] && (
                                  <div className="request-chat__attachment">
                                    <div>{m.attachments[0].file_name}</div>
                                    <div className="request-chat__attachment-meta">{formatFileSize(m.attachments[0].file_size)}</div>
                                    <button type="button" className="request-chat__btn" onClick={() => handleDownload(m.attachments[0])}>
                                      Скачать
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="request-chat__bubble-meta">
                                {own && (
                                  <span
                                    className={`request-chat__bubble-ticks${m.is_read ? ' request-chat__bubble-ticks--read' : ''}`}
                                    aria-hidden
                                  >
                                    {m.is_read ? '✓✓' : '✓'}
                                  </span>
                                )}
                                <span className="request-chat__bubble-time">{formatBubbleTime(m.created_at)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>

          {messageMenu &&
            (() => {
              const m = messages.find((msg) => msg.id === messageMenu.id);
              if (!m || m.type === 'system') return null;
              const own = m.sender_id === user.id;
              const canCopy = m.type === 'text' ? Boolean((m.content || '').trim()) : m.type === 'image' || m.type === 'file';
              return (
                <ul
                  key="floating-msg-menu"
                  className="request-chat__msg-menu request-chat__msg-menu--fixed"
                  style={{ position: 'fixed', left: messageMenu.x, top: messageMenu.y, zIndex: 400 }}
                  role="menu"
                >
                  {!chatReadOnly && (
                    <li>
                      <button type="button" className="request-chat__msg-menu-item" onClick={() => handleReplyTo(m)}>
                        Ответить
                      </button>
                    </li>
                  )}
                  {canCopy && (
                    <li>
                      <button type="button" className="request-chat__msg-menu-item" onClick={() => handleCopyMessage(m)}>
                        Копировать
                      </button>
                    </li>
                  )}
                  {own && m.type === 'text' && (
                    <li>
                      <button type="button" className="request-chat__msg-menu-item" onClick={() => handleStartEdit(m)}>
                        Редактировать
                      </button>
                    </li>
                  )}
                  {own && (
                    <li>
                      <button
                        type="button"
                        className="request-chat__msg-menu-item request-chat__msg-menu-item--danger"
                        onClick={() => handleDeleteMessage(m.id)}
                      >
                        Удалить
                      </button>
                    </li>
                  )}
                </ul>
              );
            })()}

          <MeetingCreateModal
            open={meetingModalOpen}
            onClose={() => setMeetingModalOpen(false)}
            requestId={conversation.request?.id || id}
            request={conversation.request}
            onCreated={() => {
              setMeetingModalOpen(false);
            }}
          />

          <div className="request-chat__composer request-chat__composer-vk">
            <form onSubmit={handleSend}>
              {(replyTo || pendingFile) && (
                <div className="request-chat__composer-top">
                  {replyTo && (
                    <div className="request-chat__vk-strip">
                      <div className="request-chat__vk-strip-accent" aria-hidden />
                      <div className="request-chat__vk-strip-body">
                        <div className="request-chat__vk-strip-name">{replyTo.authorName}</div>
                        <div className="request-chat__vk-strip-text">{replyTo.snippet || '…'}</div>
                      </div>
                      <button type="button" className="request-chat__vk-strip-close" onClick={() => setReplyTo(null)} disabled={sending}>
                        ×
                      </button>
                    </div>
                  )}
                  {pendingFile && (
                    <div className="request-chat__vk-strip">
                      <div className="request-chat__vk-strip-accent" aria-hidden />
                      <div className="request-chat__vk-strip-body">
                        <div className="request-chat__vk-strip-name">{pendingFile.name}</div>
                        <div className="request-chat__vk-strip-text">
                          {(pendingFile.type || 'Файл')} · {formatFileSize(pendingFile.size || 0)}
                        </div>
                      </div>
                      <button type="button" className="request-chat__vk-strip-close" onClick={() => setPendingFile(null)} disabled={sending}>
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
              {(replyTo || pendingFile) && <div className="request-chat__composer-divider" />}
              <div className="request-chat__composer-bar">
                <button
                  type="button"
                  className="request-chat__composer-plus"
                  aria-label="Прикрепить файл"
                  onClick={() => composerFileRef.current?.click()}
                  disabled={chatReadOnly || sending}
                >
                  +
                </button>
                <input
                  ref={composerFileRef}
                  type="file"
                  className="request-chat__composer-file-input"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,image/jpeg,image/png"
                  hidden
                  onChange={handleFile}
                  disabled={chatReadOnly || sending}
                />
                <textarea
                  className="request-chat__composer-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Сообщение"
                  disabled={chatReadOnly || sending}
                  rows={3}
                />
                <div className="request-chat__composer-right">
                  <button
                    type="submit"
                    className="request-chat__composer-send"
                    aria-label="Отправить"
                    disabled={chatReadOnly || sending || (!text.trim() && !pendingFile)}
                  >
                    <span aria-hidden="true">&#10148;</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
