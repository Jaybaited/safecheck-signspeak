'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, Play, RotateCcw, Film, ClipboardList } from 'lucide-react';
import StudentSidebar from '@/components/student/StudentSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { logout } from '@/lib/auth';
import { parseYouTube, youtubeEmbedUrl } from '@/lib/video';
import {
  getAssessment, getMyLevels, getAssessmentAttempt, startAssessmentAttempt,
  saveAssessmentAnswer, completeAssessmentAttempt,
  AssessmentDetail, AttemptDetail, AttemptSummary, LevelCard,
} from '@/lib/assessments-api';

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  rfidCard: string | null;
}

type View = 'loading' | 'lesson' | 'exam' | 'submitted' | 'result' | 'error';

const BTN = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_PRIMARY = BTN + ' bg-[#7B1113] hover:bg-[#9B2020] text-white';
const BTN_OUTLINE = BTN + ' border border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800';
const CARD = 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm';

const VIDEO_STYLE = { width: 'min(100%, calc(55vh * 16 / 9))' } as const;

function VideoBox({ src, captionUrl, allowYouTube = true }: { src: string | null; captionUrl: string | null; allowYouTube?: boolean }) {
  const yt = src ? parseYouTube(src) : null;
  if (!src || (yt && !allowYouTube)) {
    return (
      <div style={VIDEO_STYLE} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-gray-500">
        <Film className="w-10 h-10" />
        <p className="text-sm">Video placeholder (mock content)</p>
      </div>
    );
  }
  if (yt) {
    return (
      <iframe
        key={src}
        src={youtubeEmbedUrl(yt)}
        title="FSL video"
        style={VIDEO_STYLE}
        className="aspect-video rounded-xl bg-black"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  return (
    <video
      key={src}
      controls
      playsInline
      preload="metadata"
      controlsList="nodownload"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      style={VIDEO_STYLE}
      className="aspect-video rounded-xl bg-black"
    >
      <source src={src} />
      {captionUrl && <track kind="captions" srcLang="en" label="Captions" src={captionUrl} default />}
    </video>
  );
}

export default function AssessmentRunPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('loading');
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [card, setCard] = useState<LevelCard | null>(null);
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AttemptDetail | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'STUDENT') { router.push('/login'); return; }
      setUser(parsedUser);
    } catch { router.push('/login'); }
    finally { setAuthLoading(false); }
  }, [router]);

  const loadAll = useCallback(async () => {
    setView('loading');
    setError('');
    try {
      const [detail, levels] = await Promise.all([getAssessment(id), getMyLevels()]);
      const c = levels.find((l) => l.id === id) ?? null;
      setAssessment(detail);
      setCard(c);
      if (c?.state === 'AWAITING_REVIEW') { setView('submitted'); return; }
      if ((c?.state === 'PASSED' || c?.state === 'FAILED') && c.attemptId) {
        setResult(await getAssessmentAttempt(c.attemptId));
        setView('result');
        return;
      }
      setView('lesson');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this assessment.');
      setView('error');
    }
  }, [id]);

  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const startExam = async () => {
    if (!assessment) return;
    setBusy(true);
    setError('');
    try {
      const a = await startAssessmentAttempt(assessment.id);
      setAttempt(a);
      const saved: Record<string, string> = {};
      if (a.status === 'IN_PROGRESS') {
        const detail = await getAssessmentAttempt(a.id);
        detail.responses.forEach((r) => { if (r.submittedSign) saved[r.questionId] = r.submittedSign; });
      }
      setAnswers(saved);
      setIndex(0);
      setView('exam');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the exam.');
    } finally {
      setBusy(false);
    }
  };

  const choose = async (questionId: string, letter: string) => {
    if (!attempt || busy) return;
    const previous = answers[questionId];
    setAnswers((a) => ({ ...a, [questionId]: letter }));
    setBusy(true);
    setError('');
    try {
      await saveAssessmentAnswer(attempt.id, questionId, letter);
    } catch (err) {
      setAnswers((a) => {
        const next = { ...a };
        if (previous) next[questionId] = previous; else delete next[questionId];
        return next;
      });
      setError(err instanceof Error ? err.message : 'Could not save your answer. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!attempt) return;
    setBusy(true);
    setError('');
    try {
      await completeAssessmentAttempt(attempt.id);
      setView('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your answers.');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const questions = assessment?.questions ?? [];
  const q = questions[index];
  const answeredCount = questions.filter((x) => answers[x.id]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const choices = q ? Object.entries(q.choices ?? {}).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <StudentSidebar onLogout={handleLogout} student={user} />

      <main className="ml-64 flex flex-col p-6 gap-5">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/student/assessment" className="text-sm text-slate-500 dark:text-gray-400 hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> All levels
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{assessment?.title ?? 'Assessment'}</h1>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {view === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {view === 'error' && (
          <div className={CARD + ' flex flex-col items-start gap-4'}>
            <p>This assessment cannot be opened right now.</p>
            <Link href="/student/assessment" className={BTN_OUTLINE}>Back to levels</Link>
          </div>
        )}

        {view === 'lesson' && assessment && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className={CARD + ' xl:col-span-2 flex flex-col gap-4'}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#7B1113] text-white font-bold flex items-center justify-center">1</span>
                <h2 className="text-xl font-bold">Watch the lesson</h2>
              </div>
              <VideoBox src={assessment.lessonVideoUrl} captionUrl={null} />
              {assessment.lessonVideoUrl && parseYouTube(assessment.lessonVideoUrl) && (
                <p className="text-xs text-slate-400 dark:text-gray-500">Source: Philippine School for the Deaf (YouTube)</p>
              )}
              <div className="xl:hidden flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-[#7B1113]/5 dark:bg-[#7B1113]/10 border border-[#7B1113]/20">
                <p className="flex-1 text-lg font-semibold">Finished watching? Start the exam.</p>
                <button onClick={startExam} disabled={busy} className={BTN_PRIMARY}>
                  <Play className="w-5 h-5" /> Start the exam
                </button>
              </div>
            </div>
            <div className={CARD + ' flex flex-col gap-5 xl:sticky xl:top-6'}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#7B1113] text-white font-bold flex items-center justify-center">2</span>
                <div>
                  {card && <p className="text-sm font-semibold text-[#7B1113] dark:text-[#E8C96A]">{'Level ' + card.level}</p>}
                  <h2 className="text-xl font-bold">Answer the questions</h2>
                </div>
              </div>
              {assessment.lessonDescription && (
                <p className="text-lg text-slate-700 dark:text-gray-300">{assessment.lessonDescription}</p>
              )}
              <ul className="flex flex-col gap-3 text-lg text-slate-600 dark:text-gray-300">
                <li className="flex items-center gap-3"><ClipboardList className="w-6 h-6 shrink-0" /> {questions.length} questions</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-6 h-6 shrink-0" /> You need {assessment.passMark}% to pass</li>
                <li className="flex items-center gap-3"><Clock className="w-6 h-6 shrink-0" /> You can change an answer until you send the exam</li>
              </ul>
              <div className="hidden xl:block">
                <button onClick={startExam} disabled={busy} className={BTN_PRIMARY + ' w-full'}>
                  <Play className="w-5 h-5" /> Start the exam
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'exam' && assessment && q && (
          <div className={CARD + ' flex flex-col gap-5'}>
            <div className="flex items-center justify-between text-slate-500 dark:text-gray-400">
              <span className="font-semibold">Question {index + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-gray-800">
              <div
                className="h-2 rounded-full bg-[#7B1113]"
                style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {q.mediaUrl && (
                <div className="lg:col-span-3">
                  <VideoBox src={q.mediaUrl} captionUrl={q.captionUrl} allowYouTube={false} />
                </div>
              )}
              <div className={(q.mediaUrl ? 'lg:col-span-2' : 'lg:col-span-5') + ' flex flex-col gap-5'}>
            <p className="text-lg font-semibold">{q.prompt}</p>

            <div className="grid grid-cols-1 gap-4">
              {choices.map(([letter, text]) => {
                const selected = answers[q.id] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => choose(q.id, letter)}
                    disabled={busy}
                    className={`flex items-center gap-4 text-left px-5 py-5 rounded-xl border-2 text-lg font-semibold transition-colors disabled:opacity-60 ${
                      selected
                        ? 'border-[#7B1113] bg-[#7B1113]/10 dark:bg-[#7B1113]/20'
                        : 'border-slate-200 dark:border-gray-700 hover:border-[#7B1113]'
                    }`}
                  >
                    <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${selected ? 'bg-[#7B1113] text-white' : 'bg-slate-100 dark:bg-gray-800'}`}>
                      {letter}
                    </span>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>

            </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || busy} className={BTN_OUTLINE}>
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              {index < questions.length - 1 ? (
                <button onClick={() => setIndex((i) => i + 1)} disabled={busy} className={BTN_PRIMARY}>
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={finish} disabled={!allAnswered || busy} className={BTN_PRIMARY}>
                  <CheckCircle className="w-5 h-5" /> Finish and send
                </button>
              )}
            </div>
            {index === questions.length - 1 && !allAnswered && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Answer every question before you send. Use Back to find the ones you missed.
              </p>
            )}
          </div>
        )}

        {view === 'submitted' && (
          <div className={CARD + ' flex flex-col items-start gap-4'}>
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <Clock className="w-8 h-8" />
              <h2 className="text-xl font-bold">Your answers were sent</h2>
            </div>
            <p className="text-lg text-slate-700 dark:text-gray-300">
              School staff will check your answers. Come back later to see your result.
            </p>
            <Link href="/student/assessment" className={BTN_PRIMARY}>Back to levels</Link>
          </div>
        )}

        {view === 'result' && assessment && result && (
          <div className={CARD + ' flex flex-col gap-5'}>
            <div className="flex items-center gap-3">
              {result.passed ? (
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {result.passed ? 'You passed!' : 'Not passed yet'}
                </h2>
                <p className="text-slate-600 dark:text-gray-300 text-lg">
                  Your score: {result.score ?? 0}% (you need {assessment.passMark}%)
                </p>
              </div>
            </div>

            <ul className="divide-y divide-slate-200 dark:divide-gray-800">
              {questions.map((qq, i) => {
                const r = result.responses.find((x) => x.questionId === qq.id);
                return (
                  <li key={qq.id} className="py-2 flex items-center justify-between">
                    <span>Question {i + 1}</span>
                    {!r ? (
                      <span className="text-slate-500">Not answered</span>
                    ) : r.isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <XCircle className="w-4 h-4" /> Not correct
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-3">
              {!result.passed && card?.state === 'FAILED' && (
                <button onClick={() => { setError(''); setView('lesson'); }} className={BTN_PRIMARY}>
                  <RotateCcw className="w-5 h-5" /> Try again
                </button>
              )}
              <Link href="/student/assessment" className={BTN_OUTLINE}>Back to levels</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}