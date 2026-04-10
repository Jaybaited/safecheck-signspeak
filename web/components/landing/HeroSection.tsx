// components/landing/HeroSection.tsx
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Hand, Users } from 'lucide-react'

const HERO_CHIPS = [
  { icon: ShieldCheck, label: 'RFID Attendance'    },
  { icon: Hand,        label: 'FSL Recognition'    },
  { icon: Users,       label: '4 Role Dashboards'  },
]

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* ── Decorative background ── aria-hidden, no information conveyed by color alone (WCAG 1.4.1) */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/12 blur-[140px]" />
        <div className="absolute top-1/4 left-1/5 w-[280px] h-[280px] rounded-full bg-purple-700/10 blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/5 w-[220px] h-[220px] rounded-full bg-violet-900/15 blur-[80px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
        <div className="text-center max-w-4xl mx-auto">

          {/* ── Badge ── */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold mb-8 tracking-wide"
            role="note"
            aria-label="Official system of the Philippine School for the Deaf"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" aria-hidden="true" />
            Philippine School for the Deaf — Official System
          </div>

          {/* ── H1 ── */}
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-white">SafeCheck</span>
            <span className="text-violet-400" aria-hidden="true">–</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">
              SignSpeak
            </span>
          </h1>

          {/* ── Subtitle ── */}
          <p className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-5">
            Integrated{' '}
            <strong className="text-white/90 font-semibold">RFID-based attendance</strong>,{' '}
            <strong className="text-white/90 font-semibold">real-time safety monitoring</strong>, and{' '}
            <strong className="text-white/90 font-semibold">Filipino Sign Language recognition</strong>
            {' '}— built for the deaf community.
          </p>

          {/* ── Feature chips ── */}
          <div
            className="flex flex-wrap justify-center gap-2 mb-10"
            role="list"
            aria-label="Key system features"
          >
            {HERO_CHIPS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                role="listitem"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-sm"
              >
                <Icon className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>

          {/* ── CTAs ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className={[
                'group inline-flex items-center justify-center gap-2',
                'w-full sm:w-auto px-7 py-3.5 rounded-xl',
                'bg-violet-600 hover:bg-violet-500 text-white font-bold text-base',
                'shadow-xl shadow-violet-600/30',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F23]',
              ].join(' ')}
            >
              Login to Dashboard
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
            <a
              href="#features"
              className={[
                'inline-flex items-center justify-center gap-2',
                'w-full sm:w-auto px-7 py-3.5 rounded-xl',
                'bg-white/5 hover:bg-white/10 border border-white/12 hover:border-white/22',
                'text-white/75 hover:text-white font-semibold text-base',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F23]',
              ].join(' ')}
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* ── Dashboard Preview Mockup ── */}
        <div
          className="mt-20 max-w-5xl mx-auto"
          aria-hidden="true"   // decorative — no informational content
          role="presentation"
        >
          <div className="relative rounded-2xl border border-white/10 bg-[#16162A] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-black/25">
              <div className="w-3 h-3 rounded-full bg-red-500/60"    />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60"  />
              <div className="ml-4 px-14 py-1 rounded-md bg-white/5 border border-white/8 text-[11px] text-white/25">
                safecheck-signspeak.vercel.app/admin
              </div>
            </div>

            {/* Stat cards */}
            <div className="p-5 grid grid-cols-3 gap-4">
              {[
                { label: 'Total Students',       value: '248',  sub: 'Enrolled',       c: 'text-violet-400',  bg: 'bg-violet-500/10  border-violet-500/20'  },
                { label: "Today's Attendance",   value: '91%',  sub: '226 present',    c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'FSL Avg. Accuracy',    value: '63%',  sub: 'Across students', c: 'text-sky-400',    bg: 'bg-sky-500/10     border-sky-500/20'     },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <p className="text-[11px] text-white/45 mb-1">{s.label}</p>
                  <p className={`text-3xl font-black ${s.c}`}>{s.value}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Attendance table */}
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
                <div className="grid grid-cols-4 px-4 py-2.5 bg-white/5 text-white/35 font-semibold border-b border-white/8">
                  <span>Student</span><span>Grade</span><span>Time In</span><span>Status</span>
                </div>
                {[
                  { n: 'Maria Santos',    g: 'Grade 7',  t: '7:42 AM', s: 'Present', sc: 'text-emerald-400 bg-emerald-500/10' },
                  { n: 'Juan Dela Cruz',  g: 'Grade 10', t: '8:01 AM', s: 'Present', sc: 'text-emerald-400 bg-emerald-500/10' },
                  { n: 'Ana Reyes',       g: 'Grade 5',  t: '—',       s: 'Absent',  sc: 'text-red-400    bg-red-500/10'      },
                  { n: 'Pedro Bautista',  g: 'Grade 8',  t: '7:58 AM', s: 'Present', sc: 'text-emerald-400 bg-emerald-500/10' },
                ].map((row) => (
                  <div
                    key={row.n}
                    className="grid grid-cols-4 px-4 py-3 text-white/55 border-b border-white/5 last:border-0 items-center"
                  >
                    <span className="text-white/80 font-semibold truncate">{row.n}</span>
                    <span>{row.g}</span>
                    <span className="font-mono">{row.t}</span>
                    <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.sc}`}>
                      {row.s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#0F0F23] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}
