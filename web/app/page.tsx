'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Play, ShieldCheck, HandMetal, Bell,
  TrendingUp, Users, BookOpen, MapPin, Mail,
  Phone, Globe, Facebook, Smartphone, Download,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

const ABOUT_TABS = ['History', 'Guiding Principles', 'Curricular Offerings', 'School Report Card'] as const;
type AboutTab = typeof ABOUT_TABS[number];

// ─── Static Data ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: ShieldCheck, title: 'RFID Attendance',        desc: 'Contactless, automatic student check-in and check-out powered by RFID. Instant records, zero manual effort.' },
  { icon: HandMetal,   title: 'FSL Letter Recognition', desc: 'Real-time Filipino Sign Language alphabet detection (A–Y) using AI-powered hand landmark recognition via camera.' },
  { icon: BookOpen,    title: 'FSL Word Learning',      desc: '25 common FSL noun words with dynamic gesture recognition powered by an LSTM neural network.' },
  { icon: Bell,        title: 'Parent Alerts',          desc: 'Parents receive instant push notifications the moment their child taps in or out at school.' },
  { icon: TrendingUp,  title: 'Progress Monitoring',    desc: 'Teachers monitor per-student FSL letter and word completion with streaks and detailed breakdowns.' },
  { icon: Users,       title: 'Multi-Role Access',      desc: 'Admin, Teacher, Student, and Parent — each with their own dedicated dashboard and permissions.' },
];

const ABOUT_CONTENT: Record<AboutTab, { heading: string; body: React.ReactNode }> = {
  'History': {
    heading: 'Philippine School for the Deaf — History',
    body: (
      <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>
          The <strong className="text-gray-800">Philippine School for the Deaf (PSD)</strong>, formerly known as the{' '}
          <em>School for the Deaf and Blind (SDB)</em>, is the pioneer school for the handicapped in the country and in
          Asia. It is a semi-residential school and the only government-owned institution for the Deaf in the Philippines.
        </p>
        <p>
          PSD started in <strong className="text-gray-800">1907</strong> when Dr. David P. Barrows, the Director of
          Education, invited Miss Delia Delight Rice of Columbus, Ohio — a teacher for the deaf and daughter of deaf
          parents. Programs started with a class of three pupils, two deaf and one blind, in a small rented house in
          Ermita, Manila.
        </p>
        <p>
          In <strong className="text-gray-800">June 1923</strong>, it occupied its present building along Harrison
          Boulevard on a lot donated by an anonymous American lady. In{' '}
          <strong className="text-gray-800">June 1963</strong>, by virtue of RA 3562, the School for the Deaf and Blind
          was separated into two schools. In <strong className="text-gray-800">July 1970</strong>, the Philippine
          National School for the Blind (PNSB) was organized while PSD remained at its present site.
        </p>
        <p>
          In <strong className="text-gray-800">1986</strong>, PSD redirected its educational thrusts to serve as an
          educational, research, resource, and service center. Today, PSD adheres to the philosophy of{' '}
          <em>Total Communication (TotalCom)</em> using the Modified K+12 Basic Education Curriculum, managed under
          DepEd Pasay City Schools Division and DepEd-NCR.
        </p>
      </div>
    ),
  },
  'Guiding Principles': {
    heading: 'PSD Guiding Principles',
    body: (
      <div className="space-y-6 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Maka-Diyos', 'Makatao', 'Makabayan', 'Maka-Kalikasan'].map((v) => (
            <div key={v} className="bg-[#7B1113]/5 border border-[#7B1113]/10 rounded-xl p-3 text-center">
              <p className="font-bold text-[#7B1113] text-sm">{v}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Vision</p>
          <p className="text-gray-600 leading-relaxed italic border-l-2 border-[#7B1113]/30 pl-4">
            "We dream of Filipinos who passionately love their country and whose competencies and values enable them to
            realize their full potential and contribute meaningfully to building the nation."
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Mission</p>
          <p className="text-gray-600 leading-relaxed">
            As a learner-centered public institution, the Department of Education continuously improves itself to better
            serve its stakeholders — to protect and promote the right of every Filipino to quality, equitable,
            culture-based, and complete basic education where students, administrators, and teachers thrive.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Core Values</p>
          <p className="text-gray-600 leading-relaxed">
            Maka-Diyos · Makatao · Makakalikasan · Makabansa — the foundation of every learning experience at PSD,
            shaping students into well-rounded, values-driven Filipino citizens.
          </p>
        </div>
      </div>
    ),
  },
  'Curricular Offerings': {
    heading: 'Curricular Offerings',
    body: (
      <div className="space-y-5 text-sm text-gray-600">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Modified K+12 Basic Education Curriculum
        </p>
        <div className="space-y-3">
          {[
            {
              level: 'Pre-School & Special Programs',
              desc: 'Early intervention and foundational programs for hearing-impaired learners.',
            },
            {
              level: 'Elementary Education (Kinder – Grade 6)',
              desc: 'Specialized learning areas include Language, Speech, Speechreading, and Rhythm & Auditory Training.',
            },
            {
              level: 'Junior High School (Grade 7 – 10)',
              desc: 'Specialized curriculum with introduction to vocational tracks for the deaf.',
            },
            {
              level: 'Senior High School (Grade 11 – 12)',
              desc: '8 vocational exit programs: Computer Education, Cosmetology, Food Trades, Garment Trades, Graphic Arts, Furniture & Cabinet Making, Electricity, and Welding & Sheet Metal.',
            },
            {
              level: 'Alternative Learning System (ALS)',
              desc: 'For out-of-school youth and adults who have not completed basic education.',
            },
          ].map(({ level, desc }) => (
            <div key={level} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-2 h-2 bg-[#7B1113] rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 mb-0.5">{level}</p>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Other Services</p>
          <div className="grid grid-cols-2 gap-2">
            {['Speech & Hearing Clinic', 'Library', 'Publicity & Research Center', 'Dormitory', 'Medical Clinic', 'Apprenticeship Program'].map((s) => (
              <div key={s} className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 font-medium">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  'School Report Card': {
    heading: 'School Report Card',
    body: (
      <div className="space-y-4 text-sm text-gray-600">
        <p className="leading-relaxed">
          The PSD School Report Card provides transparency on school performance, enrolment data, and accomplishments
          in line with DepEd's commitment to quality basic education for every Filipino learner.
        </p>
        <div className="bg-[#7B1113]/5 border border-[#7B1113]/10 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7B1113] mb-2">S.Y. 2021–2022</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            The latest available School Report Card covers School Year 2021–2022 and includes enrolment statistics,
            learning outcomes, and infrastructure data aligned with DepEd standards for special education schools.
          </p>
        </div>
        <a
          href="https://psd.depedpasay.ph/about-us/school-report-card/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#7B1113] hover:text-[#9B2020] text-sm font-semibold transition-colors"
        >
          View Full School Report Card <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    ),
  },
};

// ─── Dashboard Mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none pointer-events-none">
      {/* Glow blob */}
      <div className="absolute -inset-8 bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-200 rounded-full blur-3xl opacity-60 z-0" />

      {/* Main card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl shadow-purple-200/50 border border-white/80 p-5 text-left">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Good morning 👋</p>
            <p className="text-sm font-bold text-gray-900">SafeCheck-SignSpeak</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-[#7B1113] to-[#9B2020] rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Students Present', value: '128',   change: '+12%' },
            { label: 'FSL Completed',    value: '24.5h', change: '+32%' },
            { label: 'Active Users',     value: '76%',   change: '+8%'  },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.label}</p>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Class FSL Progress</p>
            <p className="text-xs text-gray-400">This week</p>
          </div>
          {[
            { name: 'Grade 7-A', pct: 88 },
            { name: 'Grade 7-B', pct: 74 },
            { name: 'Grade 8-A', pct: 62 },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <p className="text-[10px] text-gray-500 w-14 shrink-0">{c.name}</p>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7B1113] to-[#C4972A] rounded-full"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 w-7 text-right">{c.pct}%</p>
            </div>
          ))}
        </div>

        {/* Live notification */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[11px] text-emerald-700 font-medium">
            Ana Reyes just checked in · <span className="text-emerald-500">7:45 AM</span>
          </p>
        </div>
      </div>

      {/* Floating badge — top right */}
      <div className="absolute -top-4 -right-4 z-20 bg-white shadow-lg rounded-xl px-3 py-2 border border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-[#7B1113]/10 rounded-lg flex items-center justify-center">
          <HandMetal className="w-3.5 h-3.5 text-[#7B1113]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-900">FSL Detected</p>
          <p className="text-[10px] text-gray-400">Letter "A" · 97.3%</p>
        </div>
      </div>

      {/* Floating badge — bottom left */}
      <div className="absolute -bottom-4 -left-4 z-20 bg-white shadow-lg rounded-xl px-3 py-2 border border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-900">4 Roles Active</p>
          <p className="text-[10px] text-gray-400">Admin · Teacher · Student · Parent</p>
        </div>
      </div>
    </div>
  );
}

// ─── Phone Mockup ──────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative select-none pointer-events-none">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-br from-[#7B1113]/20 via-[#C4972A]/10 to-violet-200/30 rounded-full blur-3xl opacity-70 z-0" />

      {/* Phone shell — wider + taller to match original */}
      <div className="relative z-10 w-72 bg-[#1a1a1a] rounded-[3rem] p-[5px] shadow-2xl shadow-gray-900/50 border-2 border-[#2a2a2a]">

        {/* Dynamic island notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-full z-20" />

        {/* Screen */}
        <div className="bg-[#F0F0F5] rounded-[2.6rem] overflow-hidden h-[580px] relative flex flex-col">

          {/* ── Status bar ── */}
          <div className="flex justify-between items-center px-5 pt-3 pb-0">
            <span className="text-[9px] font-bold text-gray-800">11:25</span>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-gray-600">▮▮▮</span>
              <span className="text-[8px] text-gray-600">WiFi</span>
              <span className="text-[8px] text-gray-600">🔋</span>
            </div>
          </div>

          {/* ── Greeting header ── */}
          <div className="px-4 pt-2 pb-3 flex items-start justify-between">
            <div>
              <p className="text-[12px] text-[#7B1113] font-medium">Good Evening,</p>
              <p className="text-[17px] font-extrabold text-[#7B1113] leading-tight">Juan Dela Cruz</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ready to explore FSL today?</p>
            </div>
            <div className="w-10 h-10 bg-[#7B1113] rounded-full flex items-center justify-center shadow-lg mt-1">
              <span className="text-white text-[11px] font-bold">JC</span>
            </div>
          </div>

          {/* ── Cards row: Today's Status + Monthly Streak ── */}
          <div className="px-3 flex gap-2 mb-3">

            {/* Today's Status — white card */}
            <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Today's</p>
              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-[12px] font-bold text-gray-900 mb-1.5">Attendance</p>
              {/* ABSENT badge */}
              <div className="inline-flex items-center bg-red-100 rounded-full px-2 py-0.5 mb-2">
                <span className="text-[8px] font-bold text-red-500 tracking-wide">ABSENT</span>
              </div>
              {/* Time In row */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 mb-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-[10px]">→</span>
                  <span className="text-[9px] font-medium text-gray-600">Time In</span>
                </div>
                <span className="text-[9px] font-mono text-gray-400">--:--</span>
              </div>
              {/* Time Out row */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-[10px]">↪</span>
                  <span className="text-[9px] font-medium text-gray-600">Time Out</span>
                </div>
                <span className="text-[9px] font-mono text-gray-400">--:--</span>
              </div>
            </div>

            {/* Monthly Streak — maroon card, taller */}
            <div className="w-32 bg-[#7B1113] rounded-2xl p-3 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-[10px]">📅</span>
                </div>
                <span className="text-[9px] text-white/80 font-bold">Week 16</span>
              </div>
              <p className="text-[7px] text-white/60 uppercase tracking-widest font-bold">Monthly Streak</p>
              <p className="text-[32px] font-extrabold text-white leading-none mt-0.5">2</p>
              <p className="text-[10px] text-white/70 mb-3">Days</p>
              {/* M T W T F */}
              <div className="flex gap-1 mt-auto">
                {['M','T','W','T','F'].map((d, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      i === 3
                        ? 'bg-white'
                        : 'bg-white/20'
                    }`}
                  >
                    <span className={`text-[7px] font-bold ${i === 3 ? 'text-[#7B1113]' : 'text-white/70'}`}>
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Access ── */}
          <div className="px-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-gray-900">Quick Access</p>
              <p className="text-[10px] text-[#7B1113] font-semibold">View All</p>
            </div>
            {/* 3 tall portrait cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'PRACTICE', icon: '📖', active: true  },
                { label: 'GAMES',    icon: '🎮', active: false },
                { label: 'QUIZ',     icon: '📋', active: false },
              ].map(({ label, icon, active }) => (
                <div
                  key={label}
                  className={`rounded-2xl flex flex-col items-center justify-center gap-2 py-4 shadow-sm ${
                    active
                      ? 'bg-[#7B1113]'
                      : 'bg-white border border-gray-100'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <p className={`text-[8px] font-bold tracking-widest ${active ? 'text-white' : 'text-gray-700'}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Daily Lesson card ── */}
          <div className="px-3 mb-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mb-1">Daily Lesson</p>
                <p className="text-[12px] font-extrabold text-gray-900 leading-tight mb-1">
                  Learn Sign Language Now!
                </p>
                <p className="text-[8px] text-gray-400 mb-2">Practice FSL letters with your camera</p>
                <div className="bg-[#7B1113] rounded-full px-3 py-1.5 inline-block">
                  <p className="text-[9px] text-white font-bold">Resume</p>
                </div>
              </div>
              {/* Illustration */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#7B1113]/10 to-[#C4972A]/10 rounded-xl flex items-center justify-center shrink-0 text-3xl">
                🧑‍🤝‍🧑
              </div>
            </div>
          </div>

          {/* ── Recent Attendance ── */}
          <div className="px-3">
            <p className="text-[12px] font-bold text-gray-900 mb-2">Recent Attendance</p>
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#7B1113] rounded-full" />
                  <p className="text-[10px] font-semibold text-gray-800">Apr 11, 2026</p>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[9px] text-gray-400">🕐</span>
                    <p className="text-[9px] text-gray-600 font-medium">In: 5:36 PM</p>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[9px] text-gray-400">🕐</span>
                    <p className="text-[9px] text-gray-400">Out: --:--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Tab Bar ── */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-2 pb-3 flex justify-around items-center">
            {[
              { icon: '🏠', label: 'Home',         active: true  },
              { icon: '📅', label: 'Attendance',   active: false },
              { icon: '✊', label: 'FSL Learning',  active: false },
              { icon: '👤', label: 'Profile',      active: false },
            ].map(({ icon, label, active }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className={`text-base ${active ? 'opacity-100' : 'opacity-30'}`}>{icon}</span>
                <p className={`text-[7px] font-semibold ${active ? 'text-[#7B1113]' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Floating badge — top right */}
      <div className="absolute -top-3 -right-8 z-20 bg-white shadow-lg rounded-xl px-3 py-2 border border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-900">iOS & Android</p>
          <p className="text-[10px] text-gray-400">Expo · React Native</p>
        </div>
      </div>
    </div>
  );
}
// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AboutTab>('History');
  const [videoOpen, setVideoOpen]  = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#7B1113] to-[#9B2020] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              SafeCheck<span className="text-[#7B1113]">·</span>SignSpeak
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {[
              ['#features', 'Features'],
              ['#demo',     'Demo'],
              ['#mobile',   'Mobile App'],
              ['#about',    'About PSD'],
              ['#contact',  'Contact'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Single CTA button */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-sm bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-full transition-colors font-medium"
          >
            Login <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ── 1. Hero ────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-xs px-3 py-1.5 rounded-full mb-7 font-medium">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              RFID Attendance · FSL Learning · AI Recognition
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
              Smart Schools,<br />
              <span className="text-[#7B1113]">Signing</span> the<br />
              Future.
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              An integrated RFID attendance system and Filipino Sign Language learning platform — built for the
              Philippine School for the Deaf.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
            >
              Access the System <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-400 mt-3">Admin · Teacher · Student · Parent</p>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── 2. Features ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">Core Features</p>
            <h2 className="text-4xl font-bold tracking-tight">Everything your school needs</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              From contactless attendance to AI-powered sign language learning — one platform for all roles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#7B1113]/10 to-[#C4972A]/10 rounded-xl flex items-center justify-center mb-4 group-hover:from-[#7B1113]/20 group-hover:to-[#C4972A]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#7B1113]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Video Demo ──────────────────────────────────────── */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">See It In Action</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Watch the FSL Recognition Demo</h2>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto">
            See how a student uses the real-time Filipino Sign Language camera recognition system to practice alphabet
            letters and earn progress.
          </p>

          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-2xl shadow-gray-200 border border-gray-100">
            {videoOpen ? (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
                title="FSL Recognition Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => setVideoOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B1113]/80 via-[#9B2020]/60 to-[#C4972A]/40" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">FSL Recognition in Action</p>
                    <p className="text-white/70 text-sm mt-1">Real-time hand sign detection · AI-powered</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            📌 Replace <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">YOUR_VIDEO_ID</code> with your actual YouTube demo video ID
          </p>
        </div>
      </section>

      {/* ── 4. Mobile App ──────────────────────────────────────── */}
      <section id="mobile" className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Phone Mockup */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <PhoneMockup />
            </div>

            {/* Right — Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-full mb-7 font-medium">
                <Smartphone className="w-3 h-3" />
                Mobile App — iOS & Android
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
                Learning FSL,<br />
                <span className="text-[#7B1113]">anywhere</span> you go.
              </h2>

              <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-md">
                The SafeCheck-SignSpeak mobile app brings the full FSL learning experience to students' hands — and
                keeps parents informed in real time, wherever they are.
              </p>

              {/* Bullet features */}
              <div className="space-y-3 mb-8">
                {[
                  { emoji: '✋', text: 'Real-time FSL letter and word recognition via phone camera' },
                  { emoji: '📊', text: "View personal attendance history and today's check-in status" },
                  { emoji: '🔔', text: 'Parents receive instant push alerts on every RFID tap event' },
                  { emoji: '🎮', text: 'FSL games — Speed Challenge & Letter Streak on mobile' },
                ].map(({ emoji, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-base">
                      {emoji}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#"  // TODO: Replace with your EAS build APK link
                  className="flex items-center gap-2.5 bg-gray-900 hover:bg-gray-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Download for</p>
                    <p className="text-sm font-bold leading-none">Android (APK)</p>
                  </div>
                </a>

              
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Built with React Native & Expo · Compatible with Android & iOS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. About PSD ───────────────────────────────────────── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">About</p>
            <h2 className="text-4xl font-bold tracking-tight">Philippine School for the Deaf</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              The pioneer school for the hearing-impaired in the country and in Asia, serving Filipinos since 1907.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {ABOUT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#7B1113] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              {ABOUT_CONTENT[activeTab].heading}
            </h3>
            {ABOUT_CONTENT[activeTab].body}
          </div>
        </div>
      </section>

      {/* ── 6. Contact Us ──────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">Contact Us</p>
            <h2 className="text-4xl font-bold tracking-tight">Get in Touch</h2>
            <p className="text-gray-500 mt-3">
              Reach out to the Philippine School for the Deaf for inquiries, admissions, and more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: MapPin,
                label: 'Location',
                value: '2620 F.B. Harrison St., Pasay City, Philippines 1300',
                href: 'https://maps.google.com/?q=Philippine+School+for+the+Deaf+Pasay',
              },
              {
                icon: Mail,
                label: 'Email',
                value: '500329@deped.gov.ph',
                href: 'mailto:500329@deped.gov.ph',
              },
              {
                icon: Phone,
                label: 'Telephone',
                value: '(02) 287-153-126',
                href: 'tel:+63287153126',
              },
              {
                icon: Globe,
                label: 'Official Website',
                value: 'psd.depedpasay.ph',
                href: 'https://psd.depedpasay.ph',
              },
              {
                icon: Facebook,
                label: 'Facebook Page',
                value: 'Philippine School for the Deaf – 500329 – PYC',
                href: 'https://www.facebook.com/search/top?q=Philippine%20School%20for%20the%20Deaf%20500329',
              },
              {
                icon: Globe,
                label: 'QR Code',
                value: 'Scan the PSD QR code at the school office for quick access to official links.',
                href: 'https://psd.depedpasay.ph',
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-[#7B1113]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#7B1113]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#7B1113]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm text-gray-700 font-medium leading-snug">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#7B1113] to-[#9B2020] rounded-md flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">
              SafeCheck<span className="text-[#7B1113]">·</span>SignSpeak
            </span>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Capstone Project 2026 · Philippine School for the Deaf, Pasay City
          </p>

          <div className="flex gap-5">
            {[
              ['#features', 'Features'],
              ['#demo',     'Demo'],
              ['#mobile',   'Mobile'],
              ['#about',    'About'],
              ['#contact',  'Contact'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}