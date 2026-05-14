'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Camera,
  CheckCircle,
  Lock,
  Hand,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import FSLCamera from '@/components/fsl/FSLCamera';
import type { FSLPrediction } from '@/types/fsl';
import { studentStorage } from '@/lib/storage';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

const FSL_LETTERS = [
  'A','B','C','D','E','F','G','H','I',
  'K','L','M','N','O','P','Q','R','S',
  'T','U','V','W','X','Y',
];

const TIPS: Record<string, string> = {
  A: 'Make a fist with your thumb resting on the side.',
  B: 'Hold four fingers straight up, thumb tucked across palm.',
  C: 'Curve your hand into a "C" shape.',
  D: 'Point index finger up, other fingers and thumb form a circle.',
  E: 'Curl all fingers down, thumb tucked under.',
  F: 'Touch index finger to thumb, other fingers spread.',
  G: 'Point index finger sideways, thumb parallel.',
  H: 'Two fingers pointing sideways, parallel.',
  I: 'Raise your pinky finger only.',
  K: 'Index and middle fingers up in a V, thumb between them.',
  L: 'Index finger points up, thumb points sideways — L shape.',
  M: 'Three fingers folded over thumb.',
  N: 'Two fingers folded over thumb.',
  O: 'All fingers and thumb form a circle.',
  P: 'Like K but pointing downward.',
  Q: 'Like G but pointing downward.',
  R: 'Cross index and middle fingers.',
  S: 'Make a fist with thumb over fingers.',
  T: 'Thumb between index and middle fingers.',
  U: 'Index and middle fingers together, pointing up.',
  V: 'Index and middle fingers spread in a V.',
  W: 'Three fingers spread out.',
  X: 'Hook index finger into a curve.',
  Y: 'Thumb and pinky extended, other fingers curled.',
};

const getHandRef = (letter: string) => `/fsl-references/${letter}.png`;
type Mode = 'lessons' | 'practice';

const CONFIDENCE_THRESHOLD = 0.75;

export default function FSLLearningPage() {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [mode, setMode]               = useState<Mode>('practice');
  const [selectedLetter, setSelected] = useState<string>('A');
  const [completed, setCompleted]     = useState<Set<string>>(new Set());
  const [justSigned, setJustSigned]   = useState<Set<string>>(new Set());
  const [prediction, setPrediction]   = useState<FSLPrediction | null>(null);
  const [imgError, setImgError]       = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      const saved = studentStorage.get(parsedUser.id, 'fsl_completed');
      if (saved) setCompleted(new Set(JSON.parse(saved) as string[]));
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCorrect = useCallback((pred: FSLPrediction) => {
    if (!user) return;
    setCompleted((prev) => {
      const next = new Set([...prev, selectedLetter]);
      studentStorage.set(user.id, 'fsl_completed', JSON.stringify([...next]));
      return next;
    });
    setJustSigned((prev) => new Set([...prev, selectedLetter]));
    studentStorage.logFslActivity(user.id);
  }, [user, selectedLetter]);

  const handlePrediction = useCallback((pred: FSLPrediction | null) => {
    setPrediction(pred);
  }, []);

  const selectLetter = (letter: string) => {
    setSelected(letter);
    setImgError(false);
    setPrediction(null);
    setJustSigned((prev) => {
      const next = new Set(prev);
      next.delete(letter);
      return next;
    });
  };

  const goToPrev = () => {
    const idx = FSL_LETTERS.indexOf(selectedLetter);
    if (idx > 0) selectLetter(FSL_LETTERS[idx - 1]);
  };

  const goToNext = () => {
    const idx = FSL_LETTERS.indexOf(selectedLetter);
    if (idx < FSL_LETTERS.length - 1) selectLetter(FSL_LETTERS[idx + 1]);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPct  = Math.round((completed.size / FSL_LETTERS.length) * 100);
  const currentIdx   = FSL_LETTERS.indexOf(selectedLetter);
  const isLetterDone = justSigned.has(selectedLetter);
  const isCorrectNow = !!(
    prediction &&
    prediction.sign === selectedLetter &&
    prediction.confidence >= CONFIDENCE_THRESHOLD
  );

  return (
    <div className="bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200 overflow-hidden">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 h-screen flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-200 dark:border-gray-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight">FSL Learning</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Practice Filipino Sign Language alphabet with your camera
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-full px-3 py-1.5 shadow-sm">
              <div className="w-20 bg-slate-100 dark:bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                {completed.size}/{FSL_LETTERS.length}
              </span>
            </div>
            <ThemeToggle />
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setMode('lessons')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'lessons'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Lessons
              </button>
              <button
                onClick={() => setMode('practice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'practice'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Practice
              </button>
            </div>
          </div>
        </div>

        {/* ══ LESSONS MODE ══ */}
        {mode === 'lessons' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
              {FSL_LETTERS.map((letter) => {
                const isDone = completed.has(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => { selectLetter(letter); setMode('practice'); }}
                    className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-105 flex items-center justify-center font-bold text-base ${
                      isDone
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-purple-400 text-slate-900 dark:text-white shadow-sm'
                    }`}
                  >
                    {isDone && <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-emerald-500" />}
                    {letter}
                  </button>
                );
              })}
              {['J','Z'].map((letter) => (
                <div
                  key={letter}
                  className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <Lock className="absolute top-1 right-1 w-3 h-3 text-slate-400" />
                  <span className="text-base font-bold text-slate-400 dark:text-gray-500">{letter}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ PRACTICE MODE ══ */}
        {mode === 'practice' && (
          <div className="flex-1 min-h-0 flex overflow-hidden">

            {/* CENTER column */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">

              {/* Camera */}
              <div className="flex-1 min-h-0 overflow-hidden relative bg-black">
                <FSLCamera
                  targetLetter={selectedLetter}
                  onCorrect={handleCorrect}
                  onPrediction={handlePrediction}
                  isActive={mode === 'practice'}
                />
              </div>

              {/* ── Bottom Bar ── */}
              <div className="h-16 shrink-0 flex items-stretch bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800">

                {/* Previous */}
                <button
                  onClick={goToPrev}
                  disabled={currentIdx <= 0}
                  style={{ outline: 'none' }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #f87171';
                      e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.18)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)';
                  }}
                  className="flex items-center justify-center gap-2 px-6 font-semibold text-sm
                    text-red-500 dark:text-red-400
                    border-r border-slate-200 dark:border-gray-800
                    disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                {/* Gesture Confidence */}
                <div className="flex-1 flex items-center justify-center gap-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide font-medium">Detected</span>
                    <span className={`text-2xl font-black tabular-nums transition-colors ${
                      prediction && isCorrectNow
                        ? 'text-emerald-500'
                        : prediction
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-300 dark:text-gray-600'
                    }`}>
                      {prediction ? prediction.sign : '—'}
                    </span>
                  </div>

                  <div className="w-px h-8 bg-slate-200 dark:bg-gray-700" />

                  <div className="flex flex-col items-center gap-1 min-w-[140px]">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide font-medium">Confidence</span>
                      <span className={`text-xs font-bold tabular-nums ${
                        !prediction
                          ? 'text-slate-300 dark:text-gray-600'
                          : prediction.confidence >= CONFIDENCE_THRESHOLD
                          ? 'text-emerald-500'
                          : 'text-orange-500'
                      }`}>
                        {prediction ? `${(prediction.confidence * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-150 ${
                          prediction && prediction.confidence >= CONFIDENCE_THRESHOLD
                            ? 'bg-emerald-500'
                            : 'bg-orange-400'
                        }`}
                        style={{ width: prediction ? `${(prediction.confidence * 100).toFixed(0)}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="w-px h-8 bg-slate-200 dark:bg-gray-700" />

                  <div className="text-center min-w-[100px]">
                    {isLetterDone ? (
                      <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" /> Signed correctly!
                      </span>
                    ) : isCorrectNow ? (
                      <span className="text-emerald-400 text-xs font-semibold animate-pulse">Hold it...</span>
                    ) : (
                      <span className="text-slate-400 dark:text-gray-500 text-xs">
                        Target: <span className="font-bold text-purple-500">{selectedLetter}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Next */}
                <button
                  onClick={goToNext}
                  disabled={currentIdx >= FSL_LETTERS.length - 1}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      const color = isLetterDone ? '#34d399' : '#94a3b8';
                      e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${color}`;
                      e.currentTarget.style.backgroundColor = isLetterDone
                        ? 'rgba(52,211,153,0.18)'
                        : 'rgba(148,163,184,0.18)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = isLetterDone
                      ? 'rgba(52,211,153,0.08)'
                      : 'rgba(148,163,184,0.08)';
                  }}
                  className={`flex items-center justify-center gap-2 px-6 font-semibold text-sm
                    disabled:opacity-30 disabled:cursor-not-allowed transition-colors
                    border-l border-slate-200 dark:border-gray-800 min-w-[120px] ${
                    isLetterDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-gray-300'
                  }`}
                  style={{
                    backgroundColor: isLetterDone
                      ? 'rgba(52,211,153,0.08)'
                      : 'rgba(148,163,184,0.08)',
                  }}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>

              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="w-64 shrink-0 flex flex-col border-l border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">

              {/* FSL Letter */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  FSL Letter
                </p>
                <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl border-2 transition-colors ${
                  isLetterDone
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl font-black shadow-sm ${
                    isLetterDone ? 'bg-emerald-500 text-white' : 'bg-purple-600 text-white'
                  }`}>
                    {selectedLetter}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Letter &ldquo;{selectedLetter}&rdquo;</p>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500">{currentIdx + 1} of {FSL_LETTERS.length}</p>
                    {isLetterDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Letter Grid — CSS vars for theme-safe fills */}
                <div className="grid grid-cols-6 gap-1">
                  {FSL_LETTERS.map((letter) => {
                    const isDone     = completed.has(letter);
                    const isSelected = selectedLetter === letter;

                    const btnStyle: React.CSSProperties = isSelected
                      ? {}
                      : isDone
                      ? {
                          backgroundColor: 'var(--btn-done-bg)',
                          color: 'var(--btn-done-text)',
                        }
                      : {
                          backgroundColor: 'var(--btn-default-bg)',
                          color: 'var(--btn-default-text)',
                        };

                    return (
                      <button
                        key={letter}
                        onClick={() => selectLetter(letter)}
                        title={letter}
                        style={btnStyle}
                        className={`relative h-8 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center
                          hover:brightness-125 hover:scale-105
                          ${isSelected
                            ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 dark:ring-offset-gray-900 scale-110'
                            : ''
                          }`}
                      >
                        {isDone && !isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        )}
                        {letter}
                      </button>
                    );
                  })}

                  {/* J & Z — disabled */}
                  {['J','Z'].map((l) => (
                    <div
                      key={l}
                      title={`${l} — Dynamic sign`}
                      className="h-8 w-full rounded-lg text-xs font-bold flex items-center justify-center
                        border border-dashed border-slate-300 dark:border-gray-700
                        opacity-50 cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--btn-default-bg)',
                        color: 'var(--btn-default-text)',
                        opacity: 0.4,
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hand Reference */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Hand className="w-3 h-3" /> Image Hand Reference
                </p>
                <div className="relative bg-slate-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700 aspect-square">
                  {!imgError ? (
                    <img
                      key={selectedLetter}
                      src={getHandRef(selectedLetter)}
                      alt={`FSL hand sign for letter ${selectedLetter}`}
                      className="w-full h-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3">
                      <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow">
                        {selectedLetter}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 leading-relaxed">
                        Add reference image at<br />
                        <span className="font-mono text-purple-500">/fsl-references/{selectedLetter}.png</span>
                      </p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow z-10">
                    {selectedLetter}
                  </div>
                  {isLetterDone && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                      <CheckCircle className="w-3 h-3" /> Done
                    </div>
                  )}
                </div>
              </div>

              {/* Tip */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Tip</p>
                <div className="rounded-xl p-3 border
                  bg-purple-100 border-purple-300 text-purple-950
                  dark:bg-gray-800 dark:border-purple-600 dark:text-purple-200">
                  <p className="text-xs leading-relaxed font-medium">
                    {TIPS[selectedLetter]}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}