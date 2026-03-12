'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Lock, BookOpen, Camera, ChevronRight, Star } from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import FSLCamera from '@/components/fsl/FSLCamera';
import type { FSLPrediction } from '@/types/fsl';

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

type Mode = 'lessons' | 'practice';

export default function FSLLearningPage() {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [mode, setMode]               = useState<Mode>('lessons');
  const [selectedLetter, setSelected] = useState<string | null>(null);
  const [completed, setCompleted]     = useState<Set<string>>(new Set());
  const [lastResult, setLastResult]   = useState<FSLPrediction | null>(null);
  const router                        = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/'); return; }
      setUser(parsedUser);
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCorrect = (prediction: FSLPrediction) => {
    if (!selectedLetter) return;
    setLastResult(prediction);
    setCompleted((prev) => new Set([...prev, selectedLetter]));
  };

  const handleSelectLetter = (letter: string) => {
    setSelected(letter);
    setLastResult(null);
    setMode('practice');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  const progressPct = Math.round((completed.size / FSL_LETTERS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">FSL Learning</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Practice Filipino Sign Language alphabet with your camera
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Mode Toggle */}
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 shadow-sm dark:shadow-none">
              <button
                onClick={() => setMode('lessons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'lessons'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Lessons
              </button>
              <button
                onClick={() => { setMode('practice'); if (!selectedLetter) setSelected('A'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'practice'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                Practice
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 mb-8 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Alphabet Progress</p>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {completed.size} of {FSL_LETTERS.length} letters completed
              </p>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {progressPct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Lessons Mode */}
        {mode === 'lessons' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {FSL_LETTERS.map((letter) => {
              const isDone = completed.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleSelectLetter(letter)}
                  className={`relative p-5 rounded-xl border-2 transition-all hover:scale-105 text-center group ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-purple-400 shadow-sm dark:shadow-none'
                  }`}
                >
                  {isDone && (
                    <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                  )}
                  <div className={`text-3xl font-bold mb-1 ${
                    isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {letter}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-purple-500 transition-colors flex items-center justify-center gap-1">
                    Practice <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}

            {/* J and Z — locked */}
            {['J', 'Z'].map((letter) => (
              <div key={letter}
                className="relative p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 text-center opacity-60 cursor-not-allowed">
                <Lock className="absolute top-2 right-2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <div className="text-3xl font-bold mb-1 text-slate-400 dark:text-gray-500">{letter}</div>
                <div className="text-xs text-slate-400 dark:text-gray-500">Dynamic</div>
              </div>
            ))}
          </div>
        )}

        {/* Practice Mode */}
        {mode === 'practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Letter Selector */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
              <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Choose a Letter</h2>
              <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                {FSL_LETTERS.map((letter) => {
                  const isDone = completed.has(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => { setSelected(letter); setLastResult(null); }}
                      className={`relative p-2 rounded-lg text-sm font-bold transition-colors ${
                        selectedLetter === letter
                          ? 'bg-purple-600 text-white'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {isDone && selectedLetter !== letter && (
                        <Star className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
                      )}
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera + Result */}
            <div className="lg:col-span-2 space-y-4">
              {selectedLetter ? (
                <>
                  {/* Tip Card */}
                  <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
                        {selectedLetter}
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          How to sign &ldquo;{selectedLetter}&rdquo;
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          {TIPS[selectedLetter]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Camera */}
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
                    <FSLCamera
                      targetLetter={selectedLetter}
                      onCorrect={handleCorrect}
                      isActive={mode === 'practice'}
                    />
                  </div>

                  {/* Success Banner */}
                  {lastResult && completed.has(selectedLetter) && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl p-5 text-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                        Great job! You signed &ldquo;{selectedLetter}&rdquo; correctly!
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                        Confidence: {(lastResult.confidence * 100).toFixed(1)}%
                      </p>
                      <button
                        onClick={() => {
                          const next = FSL_LETTERS[FSL_LETTERS.indexOf(selectedLetter) + 1];
                          if (next) { setSelected(next); setLastResult(null); }
                        }}
                        className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Next Letter →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm dark:shadow-none">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-gray-500">
                    Select a letter on the left to start practicing
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
