// app/login/page.tsx
'use client'

import { useState, useId }  from 'react'
import { useRouter }        from 'next/navigation'
import Link                 from 'next/link'
import { login }            from '@/lib/api'
import {
  Lock, User, AlertCircle, Eye, EyeOff,
  ShieldCheck, Hand, Bell,
} from 'lucide-react'

// ── Color tokens only — no font constants, Geist loads via layout.tsx
const C = {
  maroon:      '#7B1113',
  maroonDark:  '#5A0A0A',
  maroonLight: '#9B2020',
  gold:        '#C4972A',
  goldText:    '#8B6818',
  goldOnDark:  '#E8C96A',
  bg:          '#FDFCFC',
  surface:     '#F7F0F0',
  fg:          '#1A0808',
  fgSub:       '#5A3030',
  fgMuted:     '#A06060',
  border:      '#E5D8D8',
}

const FOCUS_LIGHT = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[#8B6818]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#FDFCFC]',
].join(' ')

const FOCUS_DARK = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[#E8C96A]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#7B1113]',
].join(' ')

const PANEL_FEATURES = [
  { icon: ShieldCheck, text: 'RFID-powered tap-to-attend for K–12'  },
  { icon: Hand,        text: 'Filipino Sign Language AI recognition' },
  { icon: Bell,        text: 'Real-time guardian safety alerts'      },
]

export default function LoginPage() {
  const router = useRouter()

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  const usernameId = useId()
  const passwordId = useId()
  const errorId    = useId()
  const hasError   = error.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      localStorage.setItem('token', res.accessToken)
      localStorage.setItem('user', JSON.stringify(res.user))

      const role = res.user.role
      if      (role === 'ADMIN')   router.push('/admin/dashboard')
      else if (role === 'STUDENT') router.push('/student/dashboard')
      else if (role === 'TEACHER') router.push('/teacher/dashboard')
      else if (role === 'PARENT')  router.push('/parent/dashboard')
      else                         router.push('/admin/dashboard')

    } catch (err: unknown) {
      setError(
        err instanceof Error    ? err.message :
        typeof err === 'string' ? err         :
        'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: C.bg, color: C.fg }}
    >
      {/* Skip nav — WCAG 2.4.1 */}
      <a
        href="#login-form"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
          'focus:px-4 focus:py-2.5 focus:rounded-md',
          'focus:text-white focus:text-sm focus:font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-[#8B6818]',
        ].join(' ')}
        style={{ backgroundColor: C.maroon }}
      >
        Skip to login form
      </a>

      {/* Paper texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        role="banner"
        className="relative z-10 border-b"
        style={{ backgroundColor: C.maroon, borderColor: C.maroonLight }}
      >
        {/* DepEd micro-strip */}
        <div
          className="hidden md:block border-b px-8 py-1"
          style={{ borderColor: C.maroonLight, backgroundColor: C.maroonDark }}
        >
          <p
            className="text-center text-[0.6rem] font-medium uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Republic of the Philippines · Department of Education ·
            Schools Division Office — Pasay City
          </p>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              aria-label="SafeCheck–SignSpeak — Return to homepage"
              className={`flex items-center gap-3 rounded-sm ${FOCUS_DARK}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs"
                style={{ backgroundColor: C.gold, color: '#fff' }}
                aria-hidden="true"
              >
                SC
              </div>
              <div aria-hidden="true">
                <p className="leading-tight font-bold text-white text-sm">
                  SafeCheck
                </p>
                <p
                  className="text-[0.62rem] font-semibold uppercase tracking-widest"
                  style={{ color: C.goldOnDark }}
                >
                  SignSpeak
                </p>
              </div>
            </Link>

            <p
              className="text-[0.65rem] font-medium uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Staff &amp; Student Portal
            </p>
          </div>
        </div>
      </header>

      {/* ── Split layout ─────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col lg:flex-row">

        {/* Left panel — decorative */}
        <div
          className="hidden lg:flex lg:w-5/12 xl:w-[42%] flex-col justify-between relative overflow-hidden px-12 xl:px-16 py-16"
          style={{ backgroundColor: C.maroon }}
          aria-hidden="true"
        >
          {/* Concentric rings */}
          {[520, 360, 210].map((size) => (
            <div
              key={size}
              className="pointer-events-none absolute rounded-full border"
              style={{
                width:       size,
                height:      size,
                borderColor: C.gold,
                opacity:     0.07,
                right:       -size * 0.35,
                bottom:      -size * 0.2,
              }}
            />
          ))}

          {/* Top content */}
          <div className="relative">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: C.goldOnDark }}
            >
              Philippine School for the Deaf
            </p>

            {/* font-bold tracking-tight — matches dashboard h1/h2 weight */}
            <h2
              className="font-bold tracking-tight text-white mb-6"
              style={{ fontSize: 'clamp(1.875rem, 3vw, 2.5rem)', lineHeight: 1.15 }}
            >
              One Platform
              <br />for Every
              <br />
              <em style={{ fontStyle: 'normal', color: C.gold }}>
                Learner &amp; Carer
              </em>
            </h2>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-xs"
              style={{ color: 'rgba(255,255,255,0.68)' }}
            >
              Log in to access your role-specific dashboard — attendance
              records, FSL progress, and real-time campus safety.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="relative space-y-5">
            <div className="mb-5 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
            {PANEL_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                  style={{
                    backgroundColor: 'rgba(196,151,42,0.15)',
                    border:          `1px solid ${C.gold}40`,
                  }}
                >
                  <Icon size={15} style={{ color: C.gold }} />
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.72)' }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div
          className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16 xl:px-24"
          style={{ backgroundColor: C.bg }}
        >
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-10">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.goldText }}
              >
                Welcome Back
              </span>

              {/* font-bold tracking-tight — identical to dashboard h1 style */}
              <h1
                className="mt-3 mb-4 font-bold tracking-tight leading-[1.1]"
                style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', color: C.fg }}
              >
                Sign in to
                <br />
                <em style={{ fontStyle: 'normal', color: C.maroon }}>
                  your portal
                </em>
              </h1>

              <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.fgSub }}>
                Use the credentials provided by your school administrator.
              </p>
            </div>

            {/* Rule divider */}
            <div className="flex items-center gap-4 mb-8">
              <span className="h-px flex-1" style={{ backgroundColor: C.border }} aria-hidden="true" />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: C.goldText }}
              >
                Login
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: C.border }} aria-hidden="true" />
            </div>

            {/* Error alert */}
            {hasError && (
              <div
                id={errorId}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="mb-8 p-4 flex items-center gap-3 rounded-lg border"
                style={{
                  backgroundColor: '#FEF2F2',
                  borderColor:     '#FECACA',
                  borderLeft:      '3px solid #EF4444',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#DC2626' }} aria-hidden="true" />
                <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form
              id="login-form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Sign in to SafeCheck–SignSpeak"
              className="space-y-8"
            >
              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor={usernameId}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: C.fgSub }}
                >
                  <User className="w-3 h-3" aria-hidden="true" />
                  Username
                </label>
                <input
                  id={usernameId}
                  type="text"
                  name="username"
                  required
                  autoComplete="username"
                  aria-required="true"
                  aria-invalid={hasError ? 'true' : 'false'}
                  aria-describedby={hasError ? errorId : undefined}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. lastname.0003294823"
                  className="w-full h-14 bg-transparent text-base font-medium px-0 focus:outline-none transition-colors duration-200 placeholder:text-[#C8B0B0]"
                  style={{
                    color:        C.fg,
                    borderBottom: `2px solid ${hasError ? '#EF4444' : C.border}`,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = C.maroon }}
                  onBlur={(e)  => { e.currentTarget.style.borderBottomColor = hasError ? '#EF4444' : C.border }}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor={passwordId}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: C.fgSub }}
                >
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="current-password"
                    aria-required="true"
                    aria-invalid={hasError ? 'true' : 'false'}
                    aria-describedby={hasError ? errorId : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-14 bg-transparent text-base font-medium px-0 pr-12 focus:outline-none transition-colors duration-200 placeholder:text-[#C8B0B0]"
                    style={{
                      color:        C.fg,
                      borderBottom: `2px solid ${hasError ? '#EF4444' : C.border}`,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = C.maroon }}
                    onBlur={(e)  => { e.currentTarget.style.borderBottomColor = hasError ? '#EF4444' : C.border }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    aria-controls={passwordId}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded transition-colors duration-200 ${FOCUS_LIGHT}`}
                    style={{ color: C.fgMuted }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.maroon)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.fgMuted)}
                  >
                    {showPassword
                      ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                      : <Eye    className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className={`w-full h-14 flex items-center justify-center gap-3 rounded-md font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_LIGHT}`}
                  style={{ backgroundColor: C.maroon }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = C.maroonLight
                      e.currentTarget.style.transform       = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow       = '0 6px 20px rgba(123,17,19,0.28)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = C.maroon
                    e.currentTarget.style.transform       = 'translateY(0)'
                    e.currentTarget.style.boxShadow       = 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"
                        aria-hidden="true"
                      />
                      <span>Signing In…</span>
                    </>
                  ) : (
                    'Access Your Portal →'
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div
              className="mt-10 pt-8 flex items-center gap-4"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <span className="h-px flex-1" style={{ backgroundColor: C.border }} aria-hidden="true" />
              <p
                aria-hidden="true"
                className="text-[0.58rem] font-medium uppercase tracking-widest"
                style={{ color: C.fgMuted }}
              >
                SafeCheck · SignSpeak · PSD
              </p>
              <span className="h-px flex-1" style={{ backgroundColor: C.border }} aria-hidden="true" />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
