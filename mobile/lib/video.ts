// YouTube link parser. Uses regex only (no URL.searchParams, unreliable in React Native).

export interface YouTubeInfo {
  id: string;
  start?: number; // seconds
  end?: number; // seconds
}

const ID_REGEX =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/i;

// Accepts "90", "90s", "1m30s", "1h2m3s"
const toSeconds = (raw: string): number | undefined => {
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!m || (!m[1] && !m[2] && !m[3])) return undefined;
  return (
    parseInt(m[1] ?? "0", 10) * 3600 +
    parseInt(m[2] ?? "0", 10) * 60 +
    parseInt(m[3] ?? "0", 10)
  );
};

const readParam = (url: string, names: string[]): number | undefined => {
  for (const name of names) {
    const m = url.match(new RegExp(`[?&#]${name}=([0-9hmsHMS]+)`));
    if (m) {
      const sec = toSeconds(m[1]);
      if (sec !== undefined) return sec;
    }
  }
  return undefined;
};

export const isYouTubeUrl = (url: string | null | undefined): boolean =>
  !!url && ID_REGEX.test(url);

export const parseYouTubeLink = (url: string | null | undefined): YouTubeInfo | null => {
  if (!url) return null;
  const idMatch = url.match(ID_REGEX);
  if (!idMatch) return null;

  const start = readParam(url, ["start", "t"]);
  const end = readParam(url, ["end"]);
  const info: YouTubeInfo = { id: idMatch[1] };
  if (start !== undefined) info.start = start;
  if (end !== undefined && (start === undefined || end > start)) info.end = end;
  return info;
};