import { useState, useEffect } from 'react';

const READ_KEY_PREFIX  = 'parent_notif_read_';
const TOTAL_KEY_PREFIX = 'parent_notif_total_';

export function usePersistedUnreadCount(parentId: string | undefined): number {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!parentId) return;

    const calculate = () => {
      try {
        const total   = parseInt(localStorage.getItem(`${TOTAL_KEY_PREFIX}${parentId}`) ?? '0', 10);
        const rawRead = localStorage.getItem(`${READ_KEY_PREFIX}${parentId}`);
        const readIds = rawRead ? (JSON.parse(rawRead) as string[]) : [];
        setUnreadCount(Math.max(0, total - readIds.length));
      } catch {
        setUnreadCount(0);
      }
    };

    calculate();
    window.addEventListener('storage', calculate);
    return () => window.removeEventListener('storage', calculate);
  }, [parentId]);

  return unreadCount;
}