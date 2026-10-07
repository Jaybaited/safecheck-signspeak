import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface SystemStatus {
  api: 'checking' | 'online' | 'offline';
  database: boolean | null;
  lastTapAt: string | null;
}

// Real status for the admin screens: is the server up, is the database up, when was the last tap today.
export function useSystemStatus(intervalMs = 30000): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>({ api: 'checking', database: null, lastTapAt: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let next: SystemStatus = { api: 'offline', database: null, lastTapAt: null };
      try {
        const health = await apiFetch<{ status: string; database: boolean }>('/health');
        next = { api: 'online', database: health.database, lastTapAt: null };
        try {
          const summary = await apiFetch<{ lastTapAt: string | null }>('/attendance/summary/today');
          next.lastTapAt = summary.lastTapAt;
        } catch {
          // the summary is for admins and teachers only
        }
      } catch {
        // server unreachable
      }
      if (!cancelled) setStatus(next);
    };
    load();
    const timer = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return status;
}