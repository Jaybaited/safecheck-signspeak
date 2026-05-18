import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'parent_notif_read_';

export function useUnreadCount(parentId: string | undefined) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const storageKey = parentId ? `${STORAGE_KEY_PREFIX}${parentId}` : null;

  // Load persisted read IDs on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      }
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  const markRead = useCallback((id: string) => {
    if (!storageKey) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [storageKey]);

  const markAllRead = useCallback((ids: string[]) => {
    if (!storageKey) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [storageKey]);

  // Calculate unread count from a given list of notification IDs
  const getUnreadCount = useCallback((allIds: string[]): number => {
    if (!hydrated) return 0;
    return allIds.filter((id) => !readIds.has(id)).length;
  }, [readIds, hydrated]);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  return { readIds, markRead, markAllRead, getUnreadCount, isRead, hydrated };
}