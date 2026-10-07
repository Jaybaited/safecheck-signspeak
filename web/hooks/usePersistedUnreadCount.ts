import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { pickChild } from '@/lib/selected-child';

const READ_KEY_PREFIX = 'parent_notif_read_';
const REFRESH_MS = 15000;

// Unread tap events for the selected child. It loads the records itself and refreshes every
// 15 seconds, so the sidebar badge is correct on every parent page and updates after a tap.
export function usePersistedUnreadCount(parentId: string | undefined): number {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!parentId) return;
    let cancelled = false;
    let recordIds: string[] = [];

    const readIds = (): string[] => {
      try {
        const raw = localStorage.getItem(READ_KEY_PREFIX + parentId);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    };

    const recalc = () => {
      const read = new Set(readIds());
      if (!cancelled) setUnreadCount(recordIds.filter((id) => !read.has(id)).length);
    };

    const load = () => {
      api.getParentChildren(parentId)
        .then((children) => (children.length ? api.getStudentAttendance((pickChild(parentId, children) ?? children[0]).id) : []))
        .then((records) => {
          recordIds = (records as { id: string }[]).map((r) => r.id);
          recalc();
        })
        .catch(() => {});
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener('storage', recalc);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('storage', recalc);
    };
  }, [parentId]);

  return unreadCount;
}