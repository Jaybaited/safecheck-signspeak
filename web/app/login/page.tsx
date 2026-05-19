'use client'

import { useState, useId } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/api'
import { ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import ForgotPasswordModal from '@/components/admin/ForgotPasswordModal'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [isExpired, setIsExpired] = useState(() => {
    const expired = searchParams.get('reason') === 'expired'
    if (expired && typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/login')
    }
    return expired
  })

  const [username,            setUsername]            = useState('')
  const [password,            setPassword]            = useState('')
  const [showPassword,        setShowPassword]        = useState(false)
  const [error,               setError]               = useState('')
  const [loading,             setLoading]             = useState(false)
  const [showForgotPassword,  setShowForgotPassword]  = useState(false)

  const usernameId = useId()
  const passwordId = useId()
  const errorId    = useId()
  const hasError   = error.length > 0

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value)
    setError('')
    setIsExpired(false)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    setError('')
    setIsExpired(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsExpired(false)

    if (!username.trim()) {
      setError('Username is required.')
      return
    }
    if (!password.trim()) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    try {
      const res = await login(username.trim(), password)

      // Store only non-sensitive user profile fields
      const { id, username: uname, role, firstName, lastName, mustChangePassword } = res.user
      localStorage.setItem(
        'user',
        JSON.stringify({ id, username: uname, role, firstName, lastName, mustChangePassword }),
      )

      // ── Mandatory first-login password change ──────────────────────────
      if (mustChangePassword) {
        router.push('/change-password')
        return
      }

      // ── Normal role-based redirect ─────────────────────────────────────
      if      (role === 'ADMIN')   router.push('/admin/dashboard')
      else if (role === 'STUDENT') router.push('/student/dashboard')
      else if (role === 'TEACHER') router.push('/teacher/assessment')
      else if (role === 'PARENT')  router.push('/parent/dashboard')
      else                         router.push('/admin/dashboard')

    } catch (err: unknown) {
      const raw =
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        ''

      if (raw.toLowerCase().includes('invalid credentials') || raw.includes('401')) {
        setError('Incorrect username or password. Please try again.')
      } else if (raw.toLowerCase().includes('network') || raw.includes('fetch')) {
        setError('Cannot connect to the server. Please check your connection.')
      } else {
        setError(raw || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] font-sans flex flex-col items-center justify-center px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">

        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7B1113] to-[#9B2020] rounded-2xl shadow-sm mb-5"
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to SafeCheck<span className="text-[#7B1113]">·</span>SignSpeak
          </p>
        </div>

        {/* Session Expired Banner */}
        {isExpired && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Your session has expired. Please sign in again.
            </p>
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor={usernameId}
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
            >
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              name="username"
              required
              autoComplete="username"
              autoFocus
              aria-required="true"
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? errorId : undefined}
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className={`w-full h-11 px-4 rounded-xl border text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all
                ${hasError
                  ? 'border-red-200 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
                }`}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={passwordId}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
              >
                Password
              </label>
              {/* Forgot Password link — inline next to the label */}
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-[#7B1113] hover:text-[#9B2020] hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
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
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className={`w-full h-11 px-4 pr-11 rounded-xl border text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all
                  ${hasError
                    ? 'border-red-200 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full h-11 flex items-center justify-center gap-2 mt-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Signing in…
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Help */}
        <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
          Credentials are issued by your school administrator.
        </p>
      </div>

      {/* Below card */}
      <div className="mt-6 flex items-center gap-4">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to Home
        </Link>
        <span className="text-gray-200">·</span>
        <a
          href="mailto:500329@deped.gov.ph"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Contact PSD
        </a>
      </div>

      {/* Footer */}
      <p className="mt-4 text-[10px] text-gray-300 uppercase tracking-widest">
        SafeCheck<span className="text-[#7B1113]">·</span>SignSpeak · Capstone 2026
      </p>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}