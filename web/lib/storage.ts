// lib/storage.ts
export const studentStorage = {
  key: (userId: string, name: string) => `student_${userId}_${name}`,

  get(userId: string, name: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.key(userId, name));
  },

  set(userId: string, name: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key(userId, name), value);
  },

  remove(userId: string, name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.key(userId, name));
  },

  // ✅ Call this every time a letter is correctly signed
  logFslActivity(userId: string): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const current = parseInt(this.get(userId, `fsl_daily_${today}`) ?? '0');
    this.set(userId, `fsl_daily_${today}`, String(current + 1));
  },

  // ✅ Get FSL sign count for a specific date
  getFslActivity(userId: string, date: string): number {
    const val = this.get(userId, `fsl_daily_${date}`);
    return val ? parseInt(val) : 0;
  },
};
