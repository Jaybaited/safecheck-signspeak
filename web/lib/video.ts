// Helpers for playing school videos from YouTube (embedded, never downloaded).
export interface YouTubeRef {
  id: string;
  start?: number;
  end?: number;
}

function toSeconds(v: string | null): number | undefined {
  if (!v) return undefined;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return undefined;
  const secs = parseInt(m[1] ?? '0', 10) * 3600 + parseInt(m[2] ?? '0', 10) * 60 + parseInt(m[3] ?? '0', 10);
  return secs > 0 ? secs : undefined;
}

// Accepts watch, youtu.be, embed, shorts, and live links. t= or start= and end= give the clip range.
export function parseYouTube(url: string | null | undefined): YouTubeRef | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = u.pathname.slice(1).split('/')[0] || null;
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') {
      id = u.searchParams.get('v');
    } else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      if (m) id = m[1];
    }
  }
  if (!id) return null;
  return {
    id,
    start: toSeconds(u.searchParams.get('start') ?? u.searchParams.get('t')),
    end: toSeconds(u.searchParams.get('end')),
  };
}

export function youtubeEmbedUrl(ref: YouTubeRef): string {
  const p = new URLSearchParams({ rel: '0', modestbranding: '1', cc_load_policy: '1', playsinline: '1' });
  if (ref.start !== undefined) p.set('start', String(ref.start));
  if (ref.end !== undefined) p.set('end', String(ref.end));
  return 'https://www.youtube-nocookie.com/embed/' + ref.id + '?' + p.toString();
}