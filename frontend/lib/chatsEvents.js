/** Единое имя события: страница /chats перезапрашивает список диалогов */
export const CHATS_LIST_REFRESH_EVENT = 'chats:list-refresh';

export function notifyChatsListRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHATS_LIST_REFRESH_EVENT));
}
