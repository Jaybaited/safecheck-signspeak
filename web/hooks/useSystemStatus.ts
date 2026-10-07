import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const FSL_API_URL = process.env.NEXT_PUBLIC_FSL_API_URL ?? 'http://localhost:8000';

export interface SystemStatus {
  api: 'checking' | 'online' | 'offline';
  database: boolean | null;
  ai: 'checking' | 'online' | 'offline' | 'nomodel';
  lastTapAt: string | null;
}

async function checkAi(): Promise<SystemStatus['ai']> {
  try {
    const res = await fetch(FSL_API_URL + '/health', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return 'offline';
    const body = (await res.json()) as { model_loaded?: boolean };
    return body.model_loaded ? 'online' : 'nomodel';
  } catch {
    return 'offline';
  }
}

// Real status for the admin screens: server, database, the recognition service, and the last tap today.
export function useSystemStatus(intervalMs = 30000): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>({
    api: 'checking', database: null, ai: 'checking', lastTapAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const aiPromise = checkAi();
      let next: SystemStatus = { api: 'offline', database: null, ai: 'checking', lastTapAt: null };
      try {
        const health = await apiFetch<{ status: string; database: boolean }>('/health');
        next = { ...next, api: 'online', database: health.database };
        try {
          const summary = await apiFetch<{ lastTapAt: string | null }>('/attendance/summary/today');
          next.lastTapAt = summary.lastTapAt;
        } catch {
          // the summary is for admins and teachers only
        }
      } catch {
        // server unreachable
      }
      next.ai = await aiPromise;
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