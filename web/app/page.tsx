// app/page.tsx — Server Component
import Link from 'next/link'
import { LandingHeader } from '@/components/LandingHeader'
import {
  CreditCard,
  ShieldCheck,
  Hand,
  Bell,
  Users,
  LayoutDashboard,
  GraduationCap,
  ScanLine,
  Eye,
  Wifi,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'

const C = {
  maroon: '#7B1113',
  maroonDark: '#5A0A0A',
  maroonLight: '#9B2020',
  gold: '#C4972A',
  goldText: '#8B6818',
  goldOnDark: '#E8C96A',
  bg: '#FDFCFC',
  surface: '#F7F0F0',
  fg: '#1A0808',
  fgSub: '#5A3030',
  fgMuted: '#A06060',
  border: '#E5D8D8',
  card: '#FFFFFF',
}

const features = [
  {
    icon: CreditCard,
    label: 'Attendance',
    title: 'RFID-Powered Attendance',
    description:
      'Tap-to-attend eliminates manual roll calls across all grade levels — from Pre-School to Senior High. Every entry and exit is timestamped and synced automatically.',
  },
  {
    icon: ShieldCheck,
    label: 'Safety',
    title: 'Real-Time Campus Safety',
    description:
      "Live campus presence gives PSD's administration and guardians instant visibility into who is on-site, with automated alerts for unexpected absences or late arrivals.",
  },
  {
    icon: Hand,
    label: 'FSL Recognition',
    title: 'Filipino Sign Language AI',
    description:
      'MediaPipe-powered FSL gesture recognition bridges Deaf learners and hearing staff — translating Filipino Sign Language signs into readable text in real time.',
  },
  {
    icon: Bell,
    label: 'Alerts',
    title: 'Instant Guardian Alerts',
    description:
      'Parents and guardians receive real-time in-app notifications the moment their child arrives at or departs from the PSD campus on F.B. Harrison St.',
  },
  {
    icon: Users,
    label: 'Multi-Role',
    title: 'Portals for Every Role',
    description:
      'Dedicated interfaces for students, teachers, administrators, and guardians — each tailored to their grade level, from Kindergarten to Grade 12 vocational tracks.',
  },
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    title: 'Admin Analytics Dashboard',
    description:
      'Enrollment reports, attendance trends, and safety analytics unified in one dashboard — built for PSD administrators, department heads, and DepEd reporting.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Student Taps RFID Card',
    description:
      'On arrival at 2620 F.B. Harrison St., students tap their personalized RFID card at the entrance scanner. Works across all grade levels — Pre-School through Senior High.',
  },
  {
    number: '02',
    title: 'System Logs Attendance',
    description:
      'Timestamp, student ID, and location are recorded instantly, updating the live attendance registry and the admin dashboard in real time.',
  },
  {
    number: '03',
    title: 'Guardian Receives Alert',
    description:
      "A push notification is sent immediately to the registered guardian confirming their child's safe arrival on the PSD campus.",
  },
  {
    number: '04',
    title: 'FSL Module Assists All Day',
    description:
      'Throughout the school day, the FSL recognition module helps Deaf learners communicate with hearing staff through real-time gesture-to-text translation.',
  },
]

// Real stats from the official PSD website
const stats = [
  { value: '1907', label: 'Year Established' },
  { value: 'K–12', label: 'Grade Levels Served' },
  { value: '8', label: 'SHS Vocational Tracks' },
  { value: '#1', label: "Gov't Deaf School in PH" },
]

// Real curricular offerings from psd.depedpasay.ph
const curricularOfferings = [
  {
    level: 'Pre-School',
    detail: 'Special Programs',
    grades: '',
  },
  {
    level: 'Elementary',
    detail: 'Kindergarten to Grade 6',
    grades: 'K–6',
  },
  {
    level: 'Junior High School',
    detail: 'General Education with TLE',
    grades: 'G7–10',
  },
  {
    level: 'Senior High School',
    detail: '8 Vocational Tracks',
    grades: 'G11–12',
  },
]

// 8 SHS vocational courses from the official PSD curricular offerings page
const vocationalTracks = [
  'Computer Education',
  'Cosmetology',
  'Food Trades',
  'Garment Trades',
  'Graphic Arts',
  'Furniture & Cabinet Making',
  'Electricity',
  'Welding & Sheet Metal',
]

const trustItems = [
  { icon: GraduationCap, label: 'Est. 1907 · Pioneer Deaf School' },
  { icon: ScanLine, label: 'RFID Attendance' },
  { icon: Hand, label: 'FSL AI Recognition' },
  { icon: Eye, label: 'Live Safety Dashboard' },
  { icon: Wifi, label: 'Real-Time Sync' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-12 flex items-center gap-4" role="presentation">
      <span
        className="h-px flex-1"
        style={{ backgroundColor: C.border }}
        aria-hidden="true"
      />
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: C.goldText }}
      >
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: C.border }}
        aria-hidden="true"
      />
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
          'focus:px-4 focus:py-2.5 focus:rounded-md',
          'focus:font-semibold focus:text-sm focus:text-white',
          'focus:outline-none focus:ring-2 focus:ring-[#8B6818]',
        ].join(' ')}
        style={{ backgroundColor: C.maroon }}
      >
        Skip to main content
      </a>

      <div className="relative min-h-screen" style={{ backgroundColor: C.bg, color: C.fg }}>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <LandingHeader />

        <main id="main-content" tabIndex={-1} className="focus:outline-none">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <section
            aria-labelledby="hero-heading"
            className="relative overflow-hidden pt-36 pb-28 lg:pt-52 lg:pb-40"
            style={{
              background: `linear-gradient(170deg, ${C.bg} 0%, ${C.surface} 55%, ${C.bg} 100%)`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px]"
              style={{ backgroundColor: C.maroon, opacity: 0.055 }}
            />

            <div className="relative mx-auto max-w-5xl px-6 lg:px-8 text-center">
              <div className="mb-8 flex items-center justify-center gap-4" role="presentation">
                <span
                  className="h-px w-16"
                  style={{ backgroundColor: C.border }}
                  aria-hidden="true"
                />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: C.goldText }}
                >
                  Philippine School for the Deaf · Est. 1907
                </span>
                <span
                  className="h-px w-16"
                  style={{ backgroundColor: C.border }}
                  aria-hidden="true"
                />
              </div>

              <h1
                id="hero-heading"
                className="font-bold tracking-tight leading-[1.05] mb-6"
                style={{ fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', color: C.fg }}
              >
                Attendance, Safety &{' '}
                <em style={{ fontStyle: 'normal', color: C.maroon }}>Sign Language</em>
                <br className="hidden sm:block" /> — One Unified System
              </h1>

              <p
                className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed"
                style={{ color: C.fgSub }}
              >
                SafeCheck-SignSpeak integrates RFID-powered attendance, real-time campus
                safety monitoring, and Filipino Sign Language recognition into a single
                platform built exclusively for the Philippine School for the Deaf —
                the pioneer and only government-owned institution for the Deaf in the
                country, serving learners since 1907.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-8 py-3.5 font-semibold text-white text-base min-h-[44px] touch-manipulation transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6818] focus-visible:ring-offset-2"
                  style={{ backgroundColor: C.maroon }}
                >
                  Access the System
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto rounded-md border px-8 py-3.5 font-semibold text-base min-h-[44px] touch-manipulation transition-all duration-200 hover:bg-[#F7F0F0] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6818] focus-visible:ring-offset-2"
                  style={{ borderColor: C.maroon, color: C.maroon }}
                >
                  Learn More
                </a>
              </div>

              <p
                className="mt-8 text-xs font-medium uppercase tracking-widest"
                style={{ color: C.fgMuted }}
                aria-hidden="true"
              >
                Pioneer Deaf School in Asia · DepEd NCR · Pasay City · Since 1907
              </p>
            </div>
          </section>

          {/* ── Trust Bar ─────────────────────────────────────────────── */}
          <div
            className="border-y overflow-x-auto"
            style={{ borderColor: C.border, backgroundColor: C.surface }}
            aria-label="Platform capabilities"
            role="region"
          >
            <div className="mx-auto max-w-5xl px-6 lg:px-8 py-4">
              <ul className="flex items-center justify-start md:justify-center gap-8 lg:gap-14 min-w-max md:min-w-0">
                {trustItems.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 shrink-0">
                    <Icon size={15} style={{ color: C.maroon }} aria-hidden="true" />
                    <span
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: C.fgSub }}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <section aria-labelledby="stats-heading" className="py-20 lg:py-28">
            <h2 id="stats-heading" className="sr-only">
              PSD key facts
            </h2>
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <dl
                className="grid grid-cols-2 lg:grid-cols-4"
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                }}
              >
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="text-center px-6 py-8"
                    style={{
                      borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : undefined,
                      borderBottom: i < 2 ? `1px solid ${C.border}` : undefined,
                    }}
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <p
                        className="text-3xl font-bold mb-1 leading-none"
                        style={{ color: C.maroon }}
                        aria-hidden="true"
                      >
                        {stat.value}
                      </p>
                      <p
                        className="text-xs font-medium uppercase tracking-wide"
                        aria-label={`${stat.value} — ${stat.label}`}
                        style={{ color: C.fgMuted }}
                      >
                        {stat.label}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* ── Core Features ─────────────────────────────────────────── */}
          <section
            id="features"
            aria-labelledby="features-heading"
            className="py-24 lg:py-36"
            style={{ backgroundColor: C.surface }}
          >
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <SectionLabel>Core Features</SectionLabel>

              <h2
                id="features-heading"
                className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                style={{ color: C.fg }}
              >
                Everything PSD Needs
              </h2>
              <p
                className="text-center mx-auto max-w-xl mb-16 text-base sm:text-lg leading-relaxed"
                style={{ color: C.fgSub }}
              >
                Three specialized modules — attendance, safety, and FSL communication —
                working as one unified system designed for the Philippines' only
                government-owned institution for the Deaf.
              </p>

              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {features.map((feature) => (
                  <li
                    key={feature.title}
                    className="rounded-xl p-8 border transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(123,17,19,0.09)]"
                    style={{
                      backgroundColor: C.card,
                      borderColor: C.border,
                      borderTop: `2px solid ${C.maroon}`,
                    }}
                  >
                    <div
                      className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg"
                      style={{ backgroundColor: C.surface }}
                      aria-hidden="true"
                    >
                      <feature.icon size={19} style={{ color: C.maroon }} />
                    </div>

                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: C.goldText }}
                    >
                      {feature.label}
                    </p>

                    <h3
                      className="text-base font-bold mb-3 leading-snug"
                      style={{ color: C.fg }}
                    >
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-relaxed" style={{ color: C.fgSub }}>
                      {feature.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── How It Works ──────────────────────────────────────────── */}
          <section
            id="how-it-works"
            aria-labelledby="hiw-heading"
            className="py-24 lg:py-36"
          >
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <SectionLabel>How It Works</SectionLabel>

              <h2
                id="hiw-heading"
                className="text-center text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                style={{ color: C.fg }}
              >
                Simple for Students, Powerful for Admins
              </h2>
              <p
                className="text-center mx-auto max-w-xl mb-20 text-base sm:text-lg leading-relaxed"
                style={{ color: C.fgSub }}
              >
                From Pre-School tap-ins to Senior High vocational track reporting —
                the whole flow happens automatically, in the background.
              </p>

              <ol
                className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14"
                aria-label="RFID attendance process steps"
              >
                {steps.map((step) => (
                  <li key={step.number} className="flex gap-6">
                    <div className="shrink-0 w-14">
                      <span
                        aria-hidden="true"
                        className="text-5xl font-bold leading-none"
                        style={{ color: C.border }}
                      >
                        {step.number}
                      </span>
                    </div>
                    <div
                      className="flex-1 pt-2 border-t"
                      style={{ borderColor: C.border }}
                    >
                      <h3
                        className="text-base font-bold mb-2 leading-snug"
                        style={{ color: C.fg }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: C.fgSub }}>
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Curricular Offerings ──────────────────────────────────── */}
          <section
            id="k12"
            aria-labelledby="k12-heading"
            className="relative overflow-hidden py-24 lg:py-32"
            style={{ backgroundColor: C.maroon }}
          >
            {[600, 420, 260].map((size) => (
              <div
                key={size}
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full border"
                style={{
                  width: size,
                  height: size,
                  borderColor: C.gold,
                  opacity: 0.08,
                  right: -size * 0.2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            ))}

            <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
              <div className="text-center mb-14">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-6"
                  style={{ color: C.goldOnDark }}
                >
                  Official Curricular Offerings
                </p>
                <h2
                  id="k12-heading"
                  className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6"
                >
                  Modified K+12 Basic Education
                  <br className="hidden lg:block" /> — From Pre-School to Senior High
                </h2>
                <p
                  className="mx-auto max-w-xl text-base sm:text-lg leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.80)' }}
                >
                  PSD delivers the DepEd Modified K+12 Basic Education Curriculum across
                  four program levels, with specialized transition and vocational skills
                  programs for graduating Senior High learners.
                </p>
              </div>

              {/* Program level cards */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {curricularOfferings.map((offering) => (
                  <li
                    key={offering.level}
                    className="rounded-xl p-6 border"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    {offering.grades && (
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: C.goldOnDark }}
                      >
                        {offering.grades}
                      </p>
                    )}
                    <p className="text-base font-bold text-white mb-1">{offering.level}</p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {offering.detail}
                    </p>
                  </li>
                ))}
              </ul>

              {/* SHS Vocational tracks */}
              <div
                className="rounded-xl p-8 border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: C.goldOnDark }}
                >
                  Senior High School — 8 Vocational Courses
                </p>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vocationalTracks.map((track) => (
                    <li
                      key={track}
                      className="text-sm font-medium text-white/80 flex items-center gap-2"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: C.gold }}
                        aria-hidden="true"
                      />
                      {track}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-8 py-3.5 font-semibold text-white text-base min-h-[44px] touch-manipulation transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#7B1113]"
                  style={{ backgroundColor: C.gold }}
                >
                  Sign in <ChevronRight size={16} aria-hidden="true" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto rounded-md border px-8 py-3.5 font-semibold text-base min-h-[44px] touch-manipulation transition-all duration-200 hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#7B1113]"
                  style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)' }}
                >
                  View Features
                </a>
              </div>
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────────────── */}
          <section
            id="about"
            aria-labelledby="cta-heading"
            className="py-24 lg:py-36"
          >
            <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
              <SectionLabel>Get Started</SectionLabel>

              <h2
                id="cta-heading"
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
                style={{ color: C.fg }}
              >
                Ready to Transform How PSD Tracks,
                <br className="hidden lg:block" /> Monitors &amp; Communicates?
              </h2>

              <p
                className="mx-auto max-w-xl mb-10 text-base sm:text-lg leading-relaxed"
                style={{ color: C.fgSub }}
              >
                SafeCheck-SignSpeak is built from the ground up for the Philippine
                School for the Deaf — Asia's pioneer institution for the Deaf, serving
                learners at 2620 F.B. Harrison St., Pasay City since 1907. Log in with
                your assigned credentials to begin.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md px-10 py-4 font-semibold text-white text-base min-h-[44px] touch-manipulation transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6818] focus-visible:ring-offset-2"
                style={{ backgroundColor: C.maroon }}
              >
                Access the System <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          role="contentinfo"
          className="border-t py-12"
          style={{ borderColor: C.border, backgroundColor: C.surface }}
        >
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-10">
              {/* Brand */}
              <div className="max-w-xs">
                <p className="text-base font-bold mb-1" style={{ color: C.fg }}>
                  SafeCheck-SignSpeak
                </p>
                <p
                  className="text-xs font-medium uppercase tracking-wide mb-4"
                  style={{ color: C.fgMuted }}
                >
                  Philippine School for the Deaf · Est. 1907
                </p>

                {/* Real PSD contact details from psd.depedpasay.ph */}
                <address className="not-italic flex flex-col gap-2">
                  <a
                    href="https://maps.google.com/?q=2620+F.B.+Harrison+St+Pasay+City+Philippines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs transition-colors hover:underline hover:underline-offset-4"
                    style={{ color: C.fgSub }}
                  >
                    <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: C.maroon }} aria-hidden="true" />
                    2620 F.B. Harrison St., Pasay City, Philippines 1300
                  </a>
                  <a
                    href="tel:+6327005-4712"
                    className="flex items-center gap-2 text-xs transition-colors hover:underline hover:underline-offset-4"
                    style={{ color: C.fgSub }}
                  >
                    <Phone size={12} style={{ color: C.maroon }} aria-hidden="true" />
                    (02) 7005 4712
                  </a>
                  <a
                    href="mailto:500329@deped.gov.ph"
                    className="flex items-center gap-2 text-xs transition-colors hover:underline hover:underline-offset-4"
                    style={{ color: C.fgSub }}
                  >
                    <Mail size={12} style={{ color: C.maroon }} aria-hidden="true" />
                    500329@deped.gov.ph
                  </a>
                </address>
              </div>

              {/* Nav links */}
              <nav className="flex flex-wrap gap-6" aria-label="Footer links">
                {[
                  { label: 'Official PSD Website', href: 'http://psd.depedpasay.ph' },
                  { label: 'Admission', href: 'http://psd.depedpasay.ph/admission' },
                  { label: 'Programs & Accomplishments', href: 'http://psd.depedpasay.ph/program-accomplishments' },
                  { label: 'DepEd Portal', href: 'https://www.deped.gov.ph' },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium transition-all duration-200 hover:underline hover:underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6818] focus-visible:ring-offset-2"
                    style={{ color: C.maroon }}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            <div
              className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-3"
              style={{ borderColor: C.border }}
            >
              <p className="text-xs" style={{ color: C.fgMuted }}>
                © 2026 Philippine School for the Deaf. All rights reserved.
              </p>
              <p className="text-xs" style={{ color: C.fgMuted }}>
                Pioneer & Only Government-Owned Institution for the Deaf in the Philippines
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}