// components/landing/HowItWorksSection.tsx
import { CreditCard, Cpu, LayoutDashboard, Bell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  icon:        LucideIcon
  title:       string
  description: string
}

const STEPS: Step[] = [
  {
    icon: CreditCard,
    title: 'Student Taps RFID Card',
    description:
      'The 125kHz card UID is captured via keyboard-emulation into a focused browser input at the school entrance.',
  },
  {
    icon: Cpu,
    title: 'System Logs Attendance',
    description:
      'The UID is POST-ed to /api/rfid/scan, validated against the student record, and the time-in is written to Supabase instantly.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboards Update',
    description:
      'Admin and teacher dashboards reflect the updated roster. Teachers see their live class headcount change in real time.',
  },
  {
    icon: Bell,
    title: 'Parent Receives Alert',
    description:
      "An automated notification confirms the student's safe arrival, with the exact time-in, sent directly to the parent.",
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="hiw-heading"
      className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="inline-block text-violet-400 text-xs font-bold tracking-[0.2em] uppercase mb-4"
            aria-hidden="true"
          >
            How It Works
          </span>
          <h2
            id="hiw-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4"
          >
            From tap to notification
            <br />
            <span className="text-violet-400">in seconds</span>
          </h2>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            The RFID attendance pipeline is fully automated — no manual entry, no delays, no errors.
          </p>
        </div>

        {/* Steps */}
        <ol
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
          aria-label="RFID attendance steps"
        >
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-11 left-[14%] right-[14%] h-px"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(139,92,246,0.35) 20%, rgba(139,92,246,0.35) 80%, transparent)',
            }}
          />

          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <li key={title} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-[88px] h-[88px] rounded-2xl bg-violet-600/10 border border-violet-500/25 shadow-xl shadow-violet-500/10">
                  <Icon className="w-9 h-9 text-violet-400" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span
                  className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-black shadow-md shadow-violet-600/40"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/48 leading-relaxed max-w-[220px]">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
