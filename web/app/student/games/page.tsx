'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gamepad2, Trophy, Zap, RotateCcw, Play,
  Star, Clock, Target, Flame, Hand, Eye, EyeOff,
  CheckCircle, X,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import FSLCamera from '@/components/fsl/FSLCamera';
import type { FSLPrediction } from '@/types/fsl';
import { studentStorage } from '@/lib/storage';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
  gradeLevel: string | null; rfidCard: string | null;
}

const FSL_LETTERS = [
  'A','B','C','D','E','F','G','H','I',
  'K','L','M','N','O','P','Q','R','S',
  'T','U','V','W','X','Y',
];

const GAME_MECHANICS: Record<string, { icon: string; text: string }[]> = {
  speed: [
    { icon: '⏱', text: '60 seconds to sign as many letters as you can' },
    { icon: '⚡', text: 'Higher confidence = more points per sign' },
    { icon: '🔁', text: 'Letter changes after each correct sign' },
  ],
  streak: [
    { icon: '🎯', text: 'Sign 10 letters correctly in a row' },
    { icon: '🕐', text: 'No time limit — focus on accuracy' },
    { icon: '⚡', text: 'Higher confidence = more points' },
  ],
};

type GameMode = 'menu' | 'speed' | 'streak' | 'result';
interface GameResult {
  score: number; mode: string;
  lettersCompleted: string[]; timeUsed?: number;
}

const SPEED_DURATION = 60;
const STREAK_TARGET  = 10;
const getHandRef = (l: string) => `/fsl-references/${l}.png`;

export default function FSLGamesPage() {
  const [user,             setUser]             = useState<User | null>(null);
  const [authLoading,      setAuthLoading]      = useState(true);
  const [gameMode,         setGameMode]         = useState<GameMode>('menu');
  const [currentLetter,    setCurrentLetter]    = useState('');
  const [score,            setScore]            = useState(0);
  const [streak,           setStreak]           = useState(0);
  const [bestStreak,       setBestStreak]       = useState(0);
  const [timeLeft,         setTimeLeft]         = useState(SPEED_DURATION);
  const [flash,            setFlash]            = useState<'correct' | null>(null);
  const [result,           setResult]           = useState<GameResult | null>(null);
  const [lettersCompleted, setLettersCompleted] = useState<string[]>([]);
  const [highScore,        setHighScore]        = useState(0);
  const [showReference,    setShowReference]    = useState(false);
  const [imgError,         setImgError]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router   = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const p = JSON.parse(userData) as User;
      if (p.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(p);
      const saved = studentStorage.get(p.id, 'fsl_highscore');
      if (saved) setHighScore(parseInt(saved));
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const getRandomLetter = useCallback((exclude?: string) => {
    const pool = FSL_LETTERS.filter(l => l !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const endGame = useCallback((finalScore: number, mode: string, completed: string[], time?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (finalScore > highScore && user) {
      setHighScore(finalScore);
      studentStorage.set(user.id, 'fsl_highscore', String(finalScore));
    }
    setResult({ score: finalScore, mode, lettersCompleted: completed, timeUsed: time });
    setGameMode('result');
  }, [highScore, user]);

  useEffect(() => {
    if (gameMode !== 'speed') return;
    timerRef.current = setInterval(() => setTimeLeft(p => p <= 1 ? 0 : p - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'speed' && timeLeft === 0)
      endGame(score, 'Speed Challenge', lettersCompleted, SPEED_DURATION);
  }, [timeLeft, gameMode, score, lettersCompleted, endGame]);

  useEffect(() => { setImgError(false); }, [currentLetter]);

  const startSpeedMode = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(0); setStreak(0); setTimeLeft(SPEED_DURATION);
    setLettersCompleted([]); setCurrentLetter(getRandomLetter());
    setResult(null); setShowReference(false);
    setGameMode('speed');
  };

  const startStreakMode = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(0); setStreak(0); setBestStreak(0);
    setLettersCompleted([]); setCurrentLetter(getRandomLetter());
    setResult(null); setShowReference(false);
    setGameMode('streak');
  };

  const handleCorrect = useCallback((prediction: FSLPrediction) => {
    setFlash('correct');
    setTimeout(() => setFlash(null), 600);
    const ns = score + Math.round(prediction.confidence * 100);
    const nk = streak + 1;
    const nc = [...lettersCompleted, currentLetter];
    setScore(ns); setStreak(nk);
    setBestStreak(p => Math.max(p, nk));
    setLettersCompleted(nc);
    if (gameMode === 'streak' && nc.length >= STREAK_TARGET) {
      endGame(ns, 'Letter Streak', nc); return;
    }
    setCurrentLetter(getRandomLetter(currentLetter));
  }, [score, streak, lettersCompleted, currentLetter, gameMode, getRandomLetter, endGame]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const quitGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameMode('menu');
  };

  if (authLoading || !user) return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isGameActive = gameMode === 'speed' || gameMode === 'streak';

  return (
    <div className="bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200 overflow-hidden">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 h-screen flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-4 pb-3
          border-b border-slate-200 dark:border-gray-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight">FSL Games</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Practice your signs in a fun and challenging way
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5
              bg-amber-50 dark:bg-amber-500/10
              border border-amber-200 dark:border-amber-500/20 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Best: {highScore.toLocaleString()}
              </span>
            </div>
            <ThemeToggle />
            {isGameActive && (
              <button
                onClick={quitGame}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                  bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700
                  hover:bg-slate-50 dark:hover:bg-gray-800
                  text-slate-600 dark:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Quit Game
              </button>
            )}
          </div>
        </div>

        {/* ══ MENU — FIXED ══ */}
        {gameMode === 'menu' && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Hero */}
<div className="relative overflow-hidden rounded-2xl p-6 text-white"
  style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 30%, #a855f7 55%, #ec4899 78%, #f97316 100%)' }}>

  {/* Dot pattern — lowered opacity so it doesn't compete with text */}
  <div className="absolute inset-0 opacity-[0.04]"
    style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />

  {/* Dark gradient overlay on the left to guarantee text contrast */}
  <div className="absolute inset-0"
    style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)' }} />

  <div className="relative flex items-center justify-between">
    {/* Left: text content */}
    <div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1
        bg-white/20 rounded-full text-[11px] font-semibold mb-3">
        <Star className="w-3 h-3 fill-white text-white" /> Your Best
      </div>
      <p className="text-4xl font-black mb-1 drop-shadow-sm">{highScore.toLocaleString()}</p>
      <p className="text-sm text-white/90 drop-shadow-sm">Keep practicing to beat your record!</p>
    </div>

    {/* Right: trophy icon — isolated so it never overlaps text */}
    <Trophy className="w-16 h-16 text-white opacity-25 shrink-0 ml-6" />
  </div>
</div>

              {/* Game Cards */}
              <div className="grid grid-cols-2 gap-4">

                {/* Speed Challenge */}
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                  rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500
                      rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1">Speed Challenge</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-snug mb-3 flex-1">
                    Sign as many letters as you can in 60 seconds.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                      border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" /> 60s
                    </span>
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                      border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400">
                      <Star className="w-3 h-3" /> Scored
                    </span>
                  </div>
                  <button
                    onClick={startSpeedMode}
                    className="w-full flex items-center justify-center gap-2 py-2.5
                      bg-purple-600 hover:bg-purple-700 active:scale-[0.98]
                      text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                </div>

                {/* Letter Streak */}
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                  rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-violet-600
                      rounded-xl flex items-center justify-center shadow-sm shadow-purple-500/20">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-1">Letter Streak</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-snug mb-3 flex-1">
                    Sign {STREAK_TARGET} letters correctly in a row.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                      border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400">
                      <Target className="w-3 h-3" /> {STREAK_TARGET} signs
                    </span>
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                      border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400">
                      <Flame className="w-3 h-3" /> Streak
                    </span>
                  </div>
                  <button
                    onClick={startStreakMode}
                    className="w-full flex items-center justify-center gap-2 py-2.5
                      bg-purple-600 hover:bg-purple-700 active:scale-[0.98]
                      text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest
                  text-slate-400 dark:text-gray-500 mb-3">Quick Tips</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🖐️', title: 'Good Lighting',  desc: 'Light your hand evenly for cleaner detection.' },
                    { icon: '📐', title: 'Clear Angles',   desc: 'Face your palm toward the camera.' },
                    { icon: '🎯', title: 'Hold Steady',    desc: 'Hold each sign still for ~1 second.' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-2.5 p-3
                      bg-slate-50 dark:bg-gray-800 rounded-xl
                      border border-slate-100 dark:border-gray-700">
                      <span className="text-lg shrink-0">{icon}</span>
                      <div>
                        <p className="text-xs font-semibold mb-0.5">{title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ ACTIVE GAME ══ */}
        {isGameActive && (
          <div className="flex-1 min-h-0 flex overflow-hidden">

            {/* CENTER — Camera */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">

              <div className="flex-1 min-h-0 overflow-hidden relative bg-black">
                <FSLCamera
                  targetLetter={currentLetter}
                  onCorrect={handleCorrect}
                  isActive={isGameActive}
                />
              </div>

              {/* ── Bottom Bar — FIXED: 3 equal flex-1 columns ── */}
              <div className="h-20 shrink-0 flex items-stretch
                bg-white dark:bg-gray-900
                border-t border-slate-200 dark:border-gray-800">

                {/* Score */}
                <div className="flex-1 flex flex-col items-center justify-center
                  border-r border-slate-200 dark:border-gray-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest
                    text-slate-400 dark:text-gray-500 mb-0.5">Score</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                    {score.toLocaleString()}
                  </p>
                </div>

                {/* Target Sign */}
                <div className={`flex-1 flex flex-col items-center justify-center
                  transition-all duration-300 ${
                  flash === 'correct' ? 'bg-emerald-500' : 'bg-purple-600'
                }`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                    flash === 'correct' ? 'text-emerald-100' : 'text-purple-300'
                  }`}>
                    {flash === 'correct' ? '✅ Correct!' : 'Target Sign'}
                  </p>
                  <p className="text-3xl font-black text-white leading-none">
                    {currentLetter}
                  </p>
                </div>

                {/* Time Left / Progress */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-6
                  border-l border-slate-200 dark:border-gray-800">
                  {gameMode === 'speed' ? (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest
                          text-slate-400 dark:text-gray-500">Time Left</p>
                        <p className={`text-sm font-black ${
                          timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-500'
                        }`}>{timeLeft}s</p>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            timeLeft <= 10 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${(timeLeft / SPEED_DURATION) * 100}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest
                          text-slate-400 dark:text-gray-500">Progress</p>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400">
                          {lettersCompleted.length}/{STREAK_TARGET}
                        </p>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${(lettersCompleted.length / STREAK_TARGET) * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="w-64 shrink-0 flex flex-col border-l border-slate-200 dark:border-gray-800
              bg-white dark:bg-gray-900 overflow-y-auto">

              {/* Selected Game Name */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500
                  uppercase tracking-widest mb-2">Selected Game</p>
                <div className={`flex items-center gap-2 font-bold text-sm ${
                  gameMode === 'speed' ? 'text-orange-500' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {gameMode === 'speed'
                    ? <Zap className="w-4 h-4 shrink-0" />
                    : <Target className="w-4 h-4 shrink-0" />
                  }
                  {gameMode === 'speed' ? 'Speed Challenge' : 'Letter Streak'}
                </div>
              </div>

              {/* Game Mechanics */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500
                  uppercase tracking-widest mb-3">Game Mechanics</p>
                <ul className="space-y-2.5">
                  {GAME_MECHANICS[gameMode]?.map(({ icon, text }, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-sm shrink-0 mt-0.5">{icon}</span>
                      <span className="text-xs text-slate-600 dark:text-gray-300 leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best Score */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500
                  uppercase tracking-widest mb-2">Best Score</p>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-2xl font-black">{highScore.toLocaleString()}</span>
                </div>
              </div>

              {/* Streak — only when > 0 */}
              {streak > 0 && (
                <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500
                    uppercase tracking-widest mb-2">Streak</p>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="text-2xl font-black text-orange-500">{streak}×</span>
                  </div>
                </div>
              )}

              {/* Show Reference Button */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => setShowReference(p => !p)}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4
                    rounded-xl text-sm font-semibold border transition-all
                    ${showReference
                      ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-purple-400'
                    }`}
                >
                  {showReference
                    ? <><EyeOff className="w-4 h-4" /> Hide Reference</>
                    : <><Eye className="w-4 h-4" /> Show Reference</>
                  }
                </button>
              </div>

              {/* Hand Image Reference */}
              {showReference && (
                <div className="p-4">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500
                    uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Hand className="w-3 h-3" /> Hand Reference
                  </p>
                  <div className="relative bg-slate-50 dark:bg-gray-800 rounded-xl overflow-hidden
                    border border-slate-100 dark:border-gray-700 aspect-square">
                    {!imgError ? (
                      <img
                        key={currentLetter}
                        src={getHandRef(currentLetter)}
                        alt={`FSL hand sign for ${currentLetter}`}
                        className="w-full h-full object-contain"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                          text-white text-3xl font-black shadow transition-colors
                          ${flash === 'correct' ? 'bg-emerald-500' : 'bg-purple-600'}`}>
                          {currentLetter}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 leading-relaxed">
                          Add reference image at<br />
                          <span className="font-mono text-purple-500">/fsl-references/{currentLetter}.png</span>
                        </p>
                      </div>
                    )}
                    <div className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center
                      justify-center text-white text-xs font-black shadow z-10 transition-colors
                      ${flash === 'correct' ? 'bg-emerald-500' : 'bg-purple-600'}`}>
                      {currentLetter}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ RESULT SCREEN ══ */}
        {gameMode === 'result' && result && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-md mx-auto space-y-4">

              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                rounded-2xl p-7 text-center shadow-sm">

                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                  ${result.score >= highScore
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/20'
                    : 'bg-slate-100 dark:bg-gray-800'
                  }`}>
                  <Trophy className={`w-8 h-8 ${
                    result.score >= highScore ? 'text-white' : 'text-slate-400 dark:text-gray-500'
                  }`} />
                </div>

                {result.score >= highScore && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3
                    bg-amber-50 dark:bg-amber-500/10
                    border border-amber-200 dark:border-amber-500/20
                    text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> New High Score!
                  </div>
                )}

                <h2 className="text-xl font-black mb-0.5">{result.mode}</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Game Complete</p>

                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  {[
                    { label: 'Score',   value: result.score.toLocaleString(), color: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Letters', value: result.lettersCompleted.length, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Best',    value: highScore.toLocaleString(),     color: 'text-amber-600 dark:text-amber-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 dark:bg-gray-800
                      border border-slate-100 dark:border-gray-700 rounded-xl p-3.5">
                      <p className={`text-2xl font-black ${color}`}>{value}</p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => result.mode === 'Speed Challenge' ? startSpeedMode() : startStreakMode()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5
                      bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                  <button
                    onClick={() => setGameMode('menu')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5
                      bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700
                      border border-slate-200 dark:border-gray-700
                      text-slate-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Gamepad2 className="w-4 h-4" /> Menu
                  </button>
                </div>
              </div>

              {result.lettersCompleted.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800
                  rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest
                    text-slate-400 dark:text-gray-500 mb-3">
                    Letters Signed ({result.lettersCompleted.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.lettersCompleted.map((l, i) => (
                      <span key={i} className="w-8 h-8 bg-purple-50 dark:bg-purple-500/10
                        border border-purple-200 dark:border-purple-500/20
                        text-purple-600 dark:text-purple-400 rounded-lg
                        text-xs font-black flex items-center justify-center">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}