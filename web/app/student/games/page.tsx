'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gamepad2, Trophy, Zap, RotateCcw,
  Play, Star, Clock, Target, ChevronRight,
} from 'lucide-react';
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

type GameMode = 'menu' | 'speed' | 'streak' | 'result';

interface GameResult {
  score: number;
  mode: string;
  lettersCompleted: string[];
  timeUsed?: number;
}

const SPEED_DURATION = 60; // seconds
const STREAK_TARGET  = 10; // letters to complete for streak mode

export default function FSLGamesPage() {
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameMode, setGameMode]     = useState<GameMode>('menu');
  const [currentLetter, setCurrentLetter] = useState('');
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(SPEED_DURATION);
  const [isActive, setIsActive]     = useState(false);
  const [flash, setFlash]           = useState<'correct' | 'wrong' | null>(null);
  const [result, setResult]         = useState<GameResult | null>(null);
  const [lettersCompleted, setLettersCompleted] = useState<string[]>([]);
  const [highScore, setHighScore]   = useState(0);
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);
  const router                      = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
      const saved = localStorage.getItem('fsl_highscore');
      if (saved) setHighScore(parseInt(saved));
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const getRandomLetter = useCallback((exclude?: string) => {
    const pool = FSL_LETTERS.filter((l) => l !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const endGame = useCallback((finalScore: number, mode: string, completed: string[], time?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('fsl_highscore', String(finalScore));
    }
    setResult({ score: finalScore, mode, lettersCompleted: completed, timeUsed: time });
    setGameMode('result');
  }, [highScore]);

  // Speed mode timer
  useEffect(() => {
    if (gameMode === 'speed' && isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame(score, 'Speed Challenge', lettersCompleted, SPEED_DURATION);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameMode, isActive, score, lettersCompleted, endGame]);

  const startSpeedMode = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(SPEED_DURATION);
    setLettersCompleted([]);
    setCurrentLetter(getRandomLetter());
    setIsActive(true);
    setGameMode('speed');
  };

  const startStreakMode = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLettersCompleted([]);
    setCurrentLetter(getRandomLetter());
    setIsActive(true);
    setGameMode('streak');
  };

  const handleCorrect = useCallback((prediction: FSLPrediction) => {
    setFlash('correct');
    setTimeout(() => setFlash(null), 400);

    const newScore  = score + Math.round(prediction.confidence * 100);
    const newStreak = streak + 1;
    const newCompleted = [...lettersCompleted, currentLetter];

    setScore(newScore);
    setStreak(newStreak);
    setBestStreak((prev) => Math.max(prev, newStreak));
    setLettersCompleted(newCompleted);

    if (gameMode === 'streak' && newCompleted.length >= STREAK_TARGET) {
      endGame(newScore, 'Letter Streak', newCompleted);
      return;
    }

    setCurrentLetter(getRandomLetter(currentLetter));
  }, [score, streak, lettersCompleted, currentLetter, gameMode, getRandomLetter, endGame]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">FSL Games</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Practice your signs in a fun and challenging way
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {gameMode !== 'menu' && gameMode !== 'result' && (
              <button
                onClick={() => { setGameMode('menu'); setIsActive(false); if (timerRef.current) clearInterval(timerRef.current); }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Quit Game
              </button>
            )}
          </div>
        </div>

        {/* MENU */}
        {gameMode === 'menu' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* High Score Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-purple-500/20">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-yellow-300" />
              <p className="text-purple-200 text-sm mb-1">Your High Score</p>
              <p className="text-5xl font-bold">{highScore.toLocaleString()}</p>
            </div>

            {/* Game Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Speed Challenge */}
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Speed Challenge</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                  Sign as many letters as you can in <span className="font-semibold text-orange-500">60 seconds</span>. Each correct sign earns points based on your confidence score.
                </p>
                <div className="flex items-center gap-4 mb-6 text-xs text-slate-400 dark:text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    60 seconds
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    Score based
                  </div>
                </div>
                <button
                  onClick={startSpeedMode}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  Play Now
                </button>
              </div>

              {/* Letter Streak */}
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Letter Streak</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                  Sign <span className="font-semibold text-purple-600 dark:text-purple-400">{STREAK_TARGET} letters</span> in a row correctly as fast as possible. No timer — just focus on accuracy.
                </p>
                <div className="flex items-center gap-4 mb-6 text-xs text-slate-400 dark:text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {STREAK_TARGET} letters
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    Accuracy based
                  </div>
                </div>
                <button
                  onClick={startStreakMode}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  Play Now
                </button>
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">How to Play</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Pick a Game',    desc: 'Choose Speed Challenge or Letter Streak above' },
                  { step: '2', title: 'Sign the Letter', desc: 'Show your hand to the camera and sign the displayed letter' },
                  { step: '3', title: 'Score Points',   desc: 'Each correct sign earns points — higher confidence = more points' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{title}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPEED / STREAK GAME */}
        {(gameMode === 'speed' || gameMode === 'streak') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* HUD */}
            <div className="space-y-4">
              {/* Score */}
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none text-center transition-colors duration-200">
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Score</p>
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {score.toLocaleString()}
                </p>
              </div>

              {/* Timer (speed mode only) */}
              {gameMode === 'speed' && (
                <div className={`bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm dark:shadow-none text-center transition-colors duration-200 ${
                  timeLeft <= 10
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-200 dark:border-gray-800'
                }`}>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Time Left</p>
                  <p className={`text-4xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                    {timeLeft}s
                  </p>
                  {/* Timer bar */}
                  <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${(timeLeft / SPEED_DURATION) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Streak (streak mode) */}
              {gameMode === 'streak' && (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none text-center transition-colors duration-200">
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Progress</p>
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {lettersCompleted.length}<span className="text-xl text-slate-400 dark:text-gray-500">/{STREAK_TARGET}</span>
                  </p>
                  <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mt-3">
                    <div
                      className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${(lettersCompleted.length / STREAK_TARGET) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Current Target */}
              <div className={`rounded-xl p-6 text-center transition-all duration-200 ${
                flash === 'correct'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-400'
                  : 'bg-purple-600 border-2 border-purple-600'
              }`}>
                <p className={`text-sm font-medium mb-2 ${flash === 'correct' ? 'text-emerald-700 dark:text-emerald-300' : 'text-purple-200'}`}>
                  {flash === 'correct' ? '✅ Correct!' : 'Sign this letter'}
                </p>
                <p className={`text-7xl font-bold ${flash === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-white'}`}>
                  {currentLetter}
                </p>
              </div>

              {/* Completed so far */}
              {lettersCompleted.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors duration-200">
                  <p className="text-xs text-slate-500 dark:text-gray-400 mb-2 font-medium">Completed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lettersCompleted.slice(-12).map((l, i) => (
                      <span key={i} className="w-7 h-7 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Camera */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
                <FSLCamera
                  targetLetter={currentLetter}
                  onCorrect={handleCorrect}
                  isActive={isActive}
                />
              </div>
            </div>
          </div>
        )}

        {/* RESULT SCREEN */}
        {gameMode === 'result' && result && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Result Card */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm dark:shadow-none text-center transition-colors duration-200">
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${result.score >= highScore ? 'text-yellow-500' : 'text-slate-400 dark:text-gray-500'}`} />

              {result.score >= highScore && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium mb-4">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  New High Score!
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{result.mode}</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Game Complete!</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.score.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Final Score</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.lettersCompleted.length}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Letters Signed</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                    {result.timeUsed ? `${SPEED_DURATION - timeLeft}s` : `${result.lettersCompleted.length}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    {result.timeUsed ? 'Time Used' : 'Streak'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => result.mode === 'Speed Challenge' ? startSpeedMode() : startStreakMode()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  onClick={() => setGameMode('menu')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  All Games
                </button>
              </div>
            </div>

            {/* Letters completed list */}
            {result.lettersCompleted.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-200">
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                  Letters you signed ({result.lettersCompleted.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.lettersCompleted.map((l, i) => (
                    <span key={i} className="w-9 h-9 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-bold flex items-center justify-center">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

