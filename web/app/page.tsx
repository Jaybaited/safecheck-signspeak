'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight, ShieldCheck, HandMetal, Bell,
  TrendingUp, Users, BookOpen, MapPin, Mail,
  Phone, Globe, Facebook,
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
            culture-based, and complete basic education.
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
            { level: 'Pre-School & Special Programs',         desc: 'Early intervention and foundational programs for hearing-impaired learners.' },
            { level: 'Elementary Education (Kinder–Grade 6)', desc: 'Specialized learning areas include Language, Speech, Speechreading, and Rhythm & Auditory Training.' },
            { level: 'Junior High School (Grade 7–10)',        desc: 'Specialized curriculum with introduction to vocational tracks for the deaf.' },
            { level: 'Senior High School (Grade 11–12)',       desc: '8 vocational exit programs: Computer Education, Cosmetology, Food Trades, Garment Trades, Graphic Arts, Furniture & Cabinet Making, Electricity, and Welding & Sheet Metal.' },
            { level: 'Alternative Learning System (ALS)',      desc: 'For out-of-school youth and adults who have not completed basic education.' },
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AboutTab>('History');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ── Navbar — white, institutional ──────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <Image
              src="/assets/PSD_Logo.png"
              alt="PSD Logo"
              width={38}
              height={38}
              className="object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-gray-900 text-sm font-bold leading-tight">Philippine School for the Deaf</p>
              <p className="text-gray-400 text-[10px] tracking-wide">DepEd Pasay City Division · NCR</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              ['#home',    'Home'],
              ['#about',   'About'],
              ['#system',  'System'],
              ['#contact', 'Contact'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Login */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-sm bg-[#7B1113] hover:bg-[#9B2020] text-white px-5 py-2 rounded-full transition-colors font-semibold shadow-sm"
          >
            Login <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

     {/* ── 1. Hero ────────────────────────────────────────── */}
<section id="home" className="relative h-screen min-h-[600px] flex items-center mt-16">

  {/* Background photo */}
  <div className="absolute inset-0 z-0">
    <Image
      src="/assets/psd1.jpg"
      alt="Philippine School for the Deaf campus"
      fill
      className="object-cover object-bottom"
      priority
    />
  </div>

  {/* Dark overlay — pure black, not maroon */}
  <div className="absolute inset-0 z-10 bg-black/55" />

  {/* Text — shifted left with pl-16 */}
  <div className="relative z-20 w-full pl-26 pr-8">
    <div className="max-w-lg">
      <p className="text-white/70 text-xs font-semibold mb-3 tracking-widest uppercase">
        Department of Education · Pasay City Division · NCR
      </p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
        Philippine School<br />for the Deaf
      </h1>
      <p className="text-white/80 text-base leading-relaxed mb-7 max-w-md">
        Pioneer school for the hearing-impaired in Asia since 1907 — now powered by
        SafeCheck-SignSpeak, an integrated RFID attendance and Filipino Sign Language
        learning platform.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg"
        >
          Access the System <ArrowRight className="w-4 h-4" />
        </button>
        <a
          href="#about"
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors border border-white/30"
        >
          About PSD
        </a>
      </div>
      <p className="text-white/40 text-xs mt-4">
        2620 F.B. Harrison St., Pasay City, Philippines 1300
      </p>
    </div>
  </div>
</section>

      {/* ── 2. Info Bar ────────────────────────────────────────── */}
      <section className="bg-[#7B1113] py-5 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: 'Est. 1907',  label: 'Pioneer School in Asia'            },
            { value: 'K–12',       label: 'Modified DepEd Curriculum'          },
            { value: '4 Roles',    label: 'Admin · Teacher · Student · Parent' },
            { value: 'DepEd NCR',  label: 'Pasay City Schools Division'        },
          ].map(({ value, label }) => (
            <div key={value}>
              <p className="text-white font-bold text-base sm:text-lg">{value}</p>
              <p className="text-white/60 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. About PSD ───────────────────────────────────────── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">About</p>
            <h2 className="text-4xl font-bold tracking-tight">Philippine School for the Deaf</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              The pioneer school for the hearing-impaired in the country and in Asia, serving Filipinos since 1907.
            </p>
          </div>

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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              {ABOUT_CONTENT[activeTab].heading}
            </h3>
            {ABOUT_CONTENT[activeTab].body}
          </div>
        </div>
      </section>

      {/* ── 4. System Features ─────────────────────────────────── */}
      <section id="system" className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">SafeCheck-SignSpeak</p>
            <h2 className="text-4xl font-bold tracking-tight">Integrated School Management System</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Purpose-built for PSD — combining RFID-based attendance monitoring with AI-powered
              Filipino Sign Language learning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white"
              >
                <div className="w-10 h-10 bg-[#7B1113]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#7B1113]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#7B1113]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Portal CTA */}
          <div className="mt-14 text-center">
            <div className="inline-flex flex-col items-center gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm px-10 py-8 max-w-sm w-full">
              <div className="flex items-center gap-3">
                <Image src="/assets/PSD_Logo.png" alt="PSD" width={36} height={36} className="object-contain" />
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-sm">SafeCheck-SignSpeak Portal</p>
                  <p className="text-gray-400 text-xs">Philippine School for the Deaf · DepEd Pasay</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 bg-[#7B1113] hover:bg-[#9B2020] text-white px-8 py-3 rounded-full text-sm font-semibold transition-colors"
              >
                Login to the System <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-400">Admin · Teacher · Student · Parent</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. School Information ──────────────────────────────── */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#7B1113] uppercase tracking-widest mb-3">School Information</p>
            <h2 className="text-4xl font-bold tracking-tight">Philippine School for the Deaf</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Official contact details and online channels of PSD — a DepEd-managed special education school
              located in Pasay City, Metro Manila.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: MapPin,
                label: 'Address',
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
                value: 'Philippine School for the Deaf',
                href: 'https://www.facebook.com/OfficialPSD',
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 bg-[#7B1113]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#7B1113]/20 transition-colors">
                  <Icon className="w-4 h-4 text-[#7B1113]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-sm text-gray-700 font-medium leading-snug">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#7B1113] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/PSD_Logo.png"
              alt="PSD Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div>
              <p className="text-white text-xs font-bold">Philippine School for the Deaf</p>
              <p className="text-white/50 text-[10px]">SafeCheck-SignSpeak · DepEd Pasay City Division</p>
            </div>
          </div>
          <p className="text-white/40 text-xs text-center">
            © {new Date().getFullYear()} Philippine School for the Deaf. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}