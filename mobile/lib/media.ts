// Exam videos are stored as paths (/assessment-videos/x.mp4) and served by the WEB app.
// Change only this line when the network changes (same laptop IP as lib/api.ts).
export const WEB_BASE_URL = "http://192.168.1.21:3000";

export const resolveMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const value = path.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value; // already a full address (Supabase Storage later)
  return `${WEB_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};