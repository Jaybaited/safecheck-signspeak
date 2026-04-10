// components/landing/StatsBar.tsx
import { ShieldCheck, Hand, Users, Wifi } from 'lucide-react'

const STATS = [
  { icon: ShieldCheck, value: '100%', label: 'Automated attendance',     detail: 'RFID-Powered'         },
  { icon: Hand,        value: '50+',  label: 'Filipino Sign Language',   detail: 'FSL Words Tracked'    },
  { icon: Users,       value: '4',    label: 'Admin · Teacher · Student · Parent', detail: 'Role Dashboards' },
  { icon: Wifi,        value: '24/7', label: 'Safety & Notifications',   detail: 'Real-Time Monitoring' },
]

export function StatsBar() {
  return (
    <section
      aria-label="System at a glance"
      className="relative py-14 border-y border-white/8 bg-gradient-to-r from-violet-950/20 via-[#0F0F23] to-violet-950/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/8">
          {STATS.map(({ icon: Icon, value, label, detail }) => (
            <div key={detail} className="flex flex-col items-center text-center px-6">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-3"
                aria-hidden="true"
              >
                <Icon className="w-5 h-5 text-violet-400" strokeWidth={1.75} />
              </div>
              <dt className="sr-only">{detail}</dt>
              <dd>
                <p className="text-3xl font-black text-white mb-1">{value}</p>
                <p className="text-xs font-semibold text-violet-400/80 mb-0.5">{detail}</p>
                <p className="text-[11px] text-white/35">{label}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
