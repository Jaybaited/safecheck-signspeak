const FSL_LETTERS = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
const FSL_STORAGE_KEY_PREFIX = 'fsl_progress_'; // must match the student app's storage key

export function useFSLProgress(studentId: string | undefined): {
  completedLetters: Set<string>;
  fslLetters: string[];
  pct: number;
} {
  // Try to read from localStorage (set by the student app)
  let completedLetters = new Set<string>();

  if (typeof window !== 'undefined' && studentId) {
    try {
      const raw = localStorage.getItem(`${FSL_STORAGE_KEY_PREFIX}${studentId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          completedLetters = new Set(parsed);
        }
      }
    } catch {}
  }

  // If no stored progress, default to ALL letters completed (matches what student sees)
  if (completedLetters.size === 0) {
    completedLetters = new Set(FSL_LETTERS);
  }

  const pct = Math.round((completedLetters.size / FSL_LETTERS.length) * 100);

  return { completedLetters, fslLetters: FSL_LETTERS, pct };
}