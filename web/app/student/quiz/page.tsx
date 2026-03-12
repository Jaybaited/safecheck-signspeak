'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList, CheckCircle, XCircle, Trophy,
  RotateCcw, ChevronRight, Clock, Star, BookOpen,
} from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

interface Question {
  id: number;
  type: 'identify' | 'describe';
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

type QuizState = 'menu' | 'quiz' | 'review' | 'result';

const QUESTION_BANK: Question[] = [
  { id: 1,  type: 'describe',  question: 'Which letter uses a closed fist with the thumb resting on the side?',              options: ['A','S','E','T'], correct: 'A', explanation: 'Letter A is a closed fist with the thumb resting on the side of the index finger.' },
  { id: 2,  type: 'describe',  question: 'Which letter is signed with four fingers pointing straight up and thumb tucked?',   options: ['B','D','F','H'], correct: 'B', explanation: 'Letter B uses four fingers straight up with the thumb tucked across the palm.' },
  { id: 3,  type: 'describe',  question: 'Which letter forms a curved "C" shape with the hand?',                              options: ['C','G','O','U'], correct: 'C', explanation: 'Letter C curves the hand into the shape of the letter C.' },
  { id: 4,  type: 'describe',  question: 'Which letter uses only the pinky finger raised?',                                   options: ['I','Y','G','L'], correct: 'I', explanation: 'Letter I is signed by raising only the pinky finger.' },
  { id: 5,  type: 'describe',  question: 'Which letter forms an "L" shape with the index finger up and thumb pointing out?',  options: ['L','F','K','V'], correct: 'L', explanation: 'Letter L uses the index finger pointing up and the thumb pointing sideways forming an L.' },
  { id: 6,  type: 'describe',  question: 'Which letter extends the thumb and pinky with other fingers curled?',               options: ['Y','I','A','K'], correct: 'Y', explanation: 'Letter Y extends the thumb and pinky finger outward.' },
  { id: 7,  type: 'describe',  question: 'Which letter makes a fist with the thumb over the fingers?',                        options: ['S','A','M','E'], correct: 'S', explanation: 'Letter S is made with a closed fist and the thumb wrapped over the fingers.' },
  { id: 8,  type: 'describe',  question: 'Which letter crosses the index and middle fingers?',                                options: ['R','U','V','K'], correct: 'R', explanation: 'Letter R is signed by crossing the index and middle fingers.' },
  { id: 9,  type: 'describe',  question: 'Which letter holds two fingers pointing sideways, parallel to each other?',        options: ['H','U','V','N'], correct: 'H', explanation: 'Letter H uses two fingers pointing sideways, parallel to the ground.' },
  { id: 10, type: 'describe',  question: 'Which letter spreads index and middle fingers into a "V" shape?',                  options: ['V','R','U','K'], correct: 'V', explanation: 'Letter V spreads the index and middle fingers apart like a peace sign.' },
  { id: 11, type: 'describe',  question: 'Which letter curls the index finger into a hook shape?',                           options: ['X','D','F','G'], correct: 'X', explanation: 'Letter X hooks the index finger into a curved shape.' },
  { id: 12, type: 'describe',  question: 'Which letter has three fingers spread wide apart?',                                 options: ['W','M','V','N'], correct: 'W', explanation: 'Letter W spreads three fingers outward.' },
  { id: 13, type: 'describe',  question: 'Which letter uses all fingers and thumb forming a circle?',                        options: ['O','C','F','D'], correct: 'O', explanation: 'Letter O curves all fingers and thumb into a circle shape.' },
  { id: 14, type: 'describe',  question: 'Which letter has the index finger pointing sideways with thumb parallel?',         options: ['G','H','D','P'], correct: 'G', explanation: 'Letter G points the index finger sideways with the thumb parallel to it.' },
  { id: 15, type: 'describe',  question: 'Which letter curls all four fingers with the thumb tucked under?',                 options: ['E','S','A','M'], correct: 'E', explanation: 'Letter E curls all four fingers downward with the thumb tucked beneath them.' },
];

const QUIZ_LENGTH = 10;

export default function FSLQuizPage() {
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [quizState, setQuizState]   = useState<QuizState>('menu');
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected]     = useState<string | null>(null);
  const [answers, setAnswers]       = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft]     = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [bestScore, setBestScore]   = useState(0);
  const router                      = useRouter();

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/'); return; }
      setUser(parsedUser);
      const saved = localStorage.getItem('fsl_quiz_best');
      if (saved) setBestScore(parseInt(saved));
    } catch { router.push('/'); }
    finally { setAuthLoading(false); }
  }, [router]);

  // Timer
  useEffect(() => {
    if (!timerActive || selected !== null) return;
    if (timeLeft <= 0) {
      handleAnswer('__timeout__');
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft, selected]);

  const shuffleQuestions = useCallback(() => {
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5).slice(0, QUIZ_LENGTH);
    return shuffled.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
  }, []);

  const startQuiz = () => {
    const qs = shuffleQuestions();
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers({});
    setSelected(null);
    setTimeLeft(20);
    setTimerActive(true);
    setQuizState('quiz');
  };

  const handleAnswer = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    setTimerActive(false);
    setAnswers((prev) => ({ ...prev, [currentIdx]: option }));
  }, [selected, currentIdx]);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
      setSelected(null);
      setTimeLeft(20);
      setTimerActive(true);
    } else {
      // Calculate score
      const correctCount = questions.filter((q, i) => answers[i] === q.correct).length;
      const finalScore   = answers[currentIdx] === questions[currentIdx].correct
        ? correctCount
        : correctCount; // already set via handleAnswer
      const total = questions.filter((q, i) => (i === currentIdx ? selected : answers[i]) === q.correct).length;

      if (total > bestScore) {
        setBestScore(total);
        localStorage.setItem('fsl_quiz_best', String(total));
      }
      setQuizState('review');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compute final score from answers
  const finalScore = quizState === 'review' || quizState === 'result'
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;
  const pct = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">FSL Quizzes</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Test your knowledge of Filipino Sign Language
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {quizState === 'quiz' && (
              <button
                onClick={() => { setQuizState('menu'); setTimerActive(false); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm transition-colors"
              >
                Quit Quiz
              </button>
            )}
          </div>
        </div>

        {/* MENU */}
        {quizState === 'menu' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Best Score */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-lg shadow-purple-500/20">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
              <p className="text-purple-200 text-sm mb-1">Best Score</p>
              <p className="text-5xl font-bold mb-1">{bestScore}<span className="text-2xl text-purple-300">/{QUIZ_LENGTH}</span></p>
              <p className="text-purple-200 text-sm">
                {bestScore === 0 ? 'No attempts yet' : `${Math.round((bestScore / QUIZ_LENGTH) * 100)}% correct`}
              </p>
            </div>

            {/* Quiz Info */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">FSL Alphabet Quiz</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: ClipboardList, label: 'Questions',   value: `${QUIZ_LENGTH}`,  color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-100 dark:bg-purple-500/10' },
                  { icon: Clock,         label: 'Per Question', value: '20s',            color: 'text-orange-500 dark:text-orange-400',  bg: 'bg-orange-100 dark:bg-orange-500/10' },
                  { icon: Star,          label: 'Topic',        value: 'FSL A-Z',        color: 'text-yellow-600 dark:text-yellow-400',  bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="text-center p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                    <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
                Questions are randomized each time. You have 20 seconds per question. Choose the correct FSL letter based on the description given.
              </p>
              <button
                onClick={startQuiz}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors shadow-sm text-base"
              >
                <ClipboardList className="w-5 h-5" />
                Start Quiz
              </button>
            </div>

            {/* Study Tip */}
            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Study Tip</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Practice the letters in the FSL Learning section before taking the quiz for better results!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {quizState === 'quiz' && currentQ && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-4 transition-colors duration-200">
              <span className="text-sm font-medium text-slate-500 dark:text-gray-400 shrink-0">
                {currentIdx + 1} / {questions.length}
              </span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              {/* Timer */}
              <div className={`flex items-center gap-1.5 shrink-0 font-bold text-sm ${
                timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-600 dark:text-gray-300'
              }`}>
                <Clock className="w-4 h-4" />
                {timeLeft}s
              </div>
            </div>

            {/* Question */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-8 shadow-sm dark:shadow-none transition-colors duration-200">
              <p className="text-lg font-semibold text-slate-900 dark:text-white mb-8 text-center leading-relaxed">
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {currentQ.options.map((option) => {
                  let style = 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10';

                  if (selected !== null) {
                    if (option === currentQ.correct) {
                      style = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300';
                    } else if (option === selected && selected !== currentQ.correct) {
                      style = 'bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300';
                    } else {
                      style = 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={selected !== null}
                      className={`relative p-5 rounded-xl border-2 text-2xl font-bold transition-all ${style} disabled:cursor-default`}
                    >
                      {option}
                      {selected !== null && option === currentQ.correct && (
                        <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                      )}
                      {selected !== null && option === selected && selected !== currentQ.correct && (
                        <XCircle className="absolute top-2 right-2 w-4 h-4 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {selected !== null && (
                <div className={`mt-5 p-4 rounded-xl border ${
                  selected === currentQ.correct
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                }`}>
                  <div className="flex items-start gap-2">
                    {selected === currentQ.correct
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    }
                    <p className={`text-sm ${
                      selected === currentQ.correct
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {selected === '__timeout__'
                        ? `Time's up! The answer was "${currentQ.correct}". `
                        : selected === currentQ.correct ? 'Correct! ' : `Incorrect. The answer is "${currentQ.correct}". `
                      }
                      {currentQ.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            {selected !== null && (
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
              >
                {currentIdx < questions.length - 1 ? (
                  <><ChevronRight className="w-5 h-5" /> Next Question</>
                ) : (
                  <><Trophy className="w-5 h-5" /> See Results</>
                )}
              </button>
            )}
          </div>
        )}

        {/* REVIEW */}
        {quizState === 'review' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Score Card */}
            <div className={`rounded-2xl p-8 text-center text-white shadow-lg ${
              pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20'
              : pct >= 60 ? 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-purple-500/20'
              : 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/20'
            }`}>
              <Trophy className="w-14 h-14 mx-auto mb-3 text-yellow-300" />
              <p className="text-white/80 text-sm mb-1">You scored</p>
              <p className="text-6xl font-bold">{finalScore}<span className="text-3xl text-white/60">/{questions.length}</span></p>
              <p className="text-white/80 mt-2 text-lg font-medium">
                {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good job!' : '📚 Keep practicing!'}
              </p>
              <p className="text-white/60 text-sm mt-1">{pct}% correct</p>
            </div>

            {/* Review Each Question */}
            <div className="space-y-3">
              {questions.map((q, i) => {
                const userAnswer = answers[i];
                const isCorrect  = userAnswer === q.correct;
                return (
                  <div key={q.id} className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors ${
                    isCorrect
                      ? 'border-emerald-300 dark:border-emerald-500/30'
                      : 'border-red-300 dark:border-red-500/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      {isCorrect
                        ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">
                          Q{i + 1}. {q.question}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            isCorrect
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}>
                            Your answer: {userAnswer === '__timeout__' ? 'No answer (timeout)' : userAnswer}
                          </span>
                          {!isCorrect && (
                            <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              Correct: {q.correct}
                            </span>
                          )}
                        </div>
                        {!isCorrect && (
                          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={startQuiz}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => setQuizState('menu')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Quiz Menu
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
