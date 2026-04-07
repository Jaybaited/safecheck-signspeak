// components/landing/RolesSection.tsx
import { Shield, BookOpen, GraduationCap, Heart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface RoleCard {
  icon:         LucideIcon
  role:         string
  tagline:      string
  description:  string
  capabilities: string[]
  styles: {
    wrapper:  string
    iconWrap: string
    accent:   string
    dot:      string
  }
}

const ROLES: RoleCard[] = [
  {
    icon: Shield,
    role: 'Admin',
    tagline: 'Full System Control',
    description:
      'Manage all users, RFID cards, system config, and access comprehensive reports — complete operational oversight.',
    capabilities: [
      'User & RFID card management',
      'System configuration',
      'All analytics & reports',
      'FSL word database',
    ],
    styles: {
      wrapper:  'border-violet-500/20 hover:border-violet-500/40 from-violet-500/8 to-purple-600/5',
      iconWrap: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
      accent:   'text-violet-400',
      dot:      'bg-violet-400',
    },
  },
  {
    icon: BookOpen,
    role: 'Teacher',
    tagline: 'Classroom Intelligence',
    description:
      "Monitor class attendance live, track each student's FSL learning journey, and stay informed on daily safety status.",
    capabilities: [
      'Live class attendance',
      'Student FSL progress',
      'Absence & late alerts',
      'Grade-level filtering',
    ],
    styles: {
      wrapper:  'border-sky-500/20 hover:border-sky-500/40 from-sky-500/8 to-blue-600/5',
      iconWrap: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
      accent:   'text-sky-400',
      dot:      'bg-sky-400',
    },
  },
  {
    icon: GraduationCap,
    role: 'Student',
    tagline: 'Learn & Track Progress',
    description:
      'Practice Filipino Sign Language via webcam, review your attendance history, and hit learning milestones on web and mobile.',
    capabilities: [
      'FSL camera practice',
      'Attendance history',
      'Word accuracy scores',
      'Mobile app (Expo Go)',
    ],
    styles: {
      wrapper:  'border-emerald-500/20 hover:border-emerald-500/40 from-emerald-500/8 to-teal-600/5',
      iconWrap: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      accent:   'text-emerald-400',
      dot:      'bg-emerald-400',
    },
  },
  {
    icon: Heart,
    role: 'Parent',
    tagline: 'Stay Safe & Connected',
    description:
      "Get automatic alerts on your child's arrival, departure, or absence. View their attendance and FSL progress anytime.",
    capabilities: [
      'Arrival & departure alerts',
      'Attendance history view',
      "Child's FSL progress",
      'Email-based account',
    ],
    styles: {
      wrapper:  'border-rose-500/20 hover:border-rose-500/40 from-rose-500/8 to-pink-600/5',
      iconWrap: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      accent:   'text-rose-400',
      dot:      'bg-rose-400',
    },
  },
]

export function RolesSection() {
  return (
    <section
      id="roles"
      aria-labelledby="roles-heading"
      className="py-28 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="inline-block text-violet-400 text-xs font-bold tracking-[0.2em] uppercase mb-4"
            aria-hidden="true"
          >
            For Everyone
          </span>
          <h2
            id="roles-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4"
          >
            One system,
            <br />
            <span className="text-violet-400">four perspectives</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Each role sees a tailored, focused experience — the right data, the right tools, nothing extra.
          </p>
        </div>

        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          role="list"
        >
          {ROLES.map(({ icon: Icon, role, tagline, description, capabilities, styles }) => (
            <li
              key={role}
              className={[
                'group relative flex flex-col rounded-2xl border bg-gradient-to-b p-6',
                'transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl hover:shadow-black/40',
                styles.wrapper,
              ].join(' ')}
            >
              <div
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border mb-4 ${styles.iconWrap}`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>

              <p className={`text-xs font-bold tracking-wide uppercase mb-1 ${styles.accent}`}>
                {tagline}
              </p>
              <h3 className="text-xl font-black text-white mb-3">{role}</h3>
              <p className="text-sm text-white/48 leading-relaxed mb-5 flex-grow">{description}</p>

              <ul className="space-y-1.5" aria-label={`${role} capabilities`}>
                {capabilities.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-white/55">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`}
                      aria-hidden="true"
                    />
                    {cap}
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
