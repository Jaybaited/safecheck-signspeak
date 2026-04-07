// components/landing/FeaturesSection.tsx
import {
  CreditCard, Camera, LayoutDashboard,
  Bell, BarChart2, Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon:       LucideIcon
  title:      string
  description:string
  highlights: string[]
  iconClass:  string
  borderClass:string
}

const FEATURES: Feature[] = [
  {
    icon: CreditCard,
    title: 'RFID Attendance & Safety',
    description:
      'Students tap their 125kHz proximity cards for instant attendance logging. Track who is on campus in real time. Admins can suspend, replace, or reissue cards immediately.',
    highlights: ['Automatic time-in/time-out', 'Lost card suspension flow', 'Live campus safety overview'],
    iconClass:   'bg-violet-500/10 border-violet-500/25 text-violet-400',
    borderClass: 'border-violet-500/15 hover:border-violet-500/35',
  },
  {
    icon: Camera,
    title: 'FSL Recognition via Webcam',
    description:
      'MediaPipe-powered hand landmark detection feeds a trained classifier for real-time Filipino Sign Language prediction. Students receive instant accuracy feedback.',
    highlights: ['MediaPipe 21-point tracking', 'Real-time prediction overlay', 'Per-word accuracy scores'],
    iconClass:   'bg-purple-500/10 border-purple-500/25 text-purple-400',
    borderClass: 'border-purple-500/15 hover:border-purple-500/35',
  },
  {
    icon: LayoutDashboard,
    title: 'Role-Based Dashboards',
    description:
      'Every role sees a tailored, data-driven view. Admins manage the system, Teachers monitor classes, Students track FSL learning, and Parents view safety updates.',
    highlights: ['4 distinct dashboard layouts', 'JWT-secured role routing', 'Mobile-ready for students'],
    iconClass:   'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
    borderClass: 'border-indigo-500/15 hover:border-indigo-500/35',
  },
  {
    icon: Bell,
    title: 'Real-Time Parent Alerts',
    description:
      'Parents receive automatic notifications on arrival, departure, or absence. Teachers get daily classroom safety summaries before their first period.',
    highlights: ['Arrival & departure alerts', 'Absence push notifications', 'Teacher morning summaries'],
    iconClass:   'bg-violet-500/10 border-violet-500/25 text-violet-400',
    borderClass: 'border-violet-500/15 hover:border-violet-500/35',
  },
  {
    icon: BarChart2,
    title: 'FSL Progress Analytics',
    description:
      'Track each student\'s sign language journey — accuracy over time, completed word categories, and areas needing improvement, visible to both teacher and student.',
    highlights: ['Per-student accuracy history', 'Category completion rates', 'Teacher progress reports'],
    iconClass:   'bg-purple-500/10 border-purple-500/25 text-purple-400',
    borderClass: 'border-purple-500/15 hover:border-purple-500/35',
  },
  {
    icon: Lock,
    title: 'Secure Auth & Access Control',
    description:
      'Custom JWT authentication with server-side role enforcement on every request. Admin-only account creation with the `lastname.rfidUID` username convention.',
    highlights: ['lastname.rfidUID convention', 'Server-validated roles', 'Admin-controlled provisioning'],
    iconClass:   'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
    borderClass: 'border-indigo-500/15 hover:border-indigo-500/35',
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-28 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-violet-400 text-xs font-bold tracking-[0.2em] uppercase mb-4"
            aria-hidden="true"
          >
            Core Features
          </span>
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4"
          >
            Everything the school needs,
            <br />
            <span className="text-violet-400">in one platform</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Built accessibility-first for the Philippine School for the Deaf —
            real-time, inclusive, and cohesive.
          </p>
        </div>

        {/* ── Grid ── */}
        <ul
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          role="list"
        >
          {FEATURES.map(({ icon: Icon, title, description, highlights, iconClass, borderClass }) => (
            <li
              key={title}
              className={[
                'group relative rounded-2xl border bg-white/[0.025] p-6',
                'transition-all duration-300 hover:bg-white/[0.045] hover:shadow-2xl hover:shadow-black/30',
                borderClass,
              ].join(' ')}
            >
              <div
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border mb-5 ${iconClass}`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>

              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/48 leading-relaxed mb-5">{description}</p>

              <ul className="space-y-1.5" aria-label={`${title} highlights`}>
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-white/55">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
