// components/LandingHeader.tsx
'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { Menu, X }             from 'lucide-react'

const C = {
  maroon:      '#7B1113',
  maroonDark:  '#5A0A0A',
  maroonLight: '#9B2020',
  gold:        '#C4972A',
  goldOnDark:  '#E8C96A',
}

const FOCUS_DARK = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[#E8C96A]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#7B1113]',
].join(' ')

const NAV_LINKS = [
  { href: '#features',     label: 'Features'     },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#k12',          label: 'For K–12'     },
  { href: '#about',        label: 'About PSD'    },
]

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
      style={{
        backgroundColor: C.maroon,
        boxShadow: scrolled ? '0 2px 16px rgba(26,4,4,0.22)' : 'none',
      }}
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

          {/* Logo */}
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`text-sm font-medium rounded-sm transition-colors duration-200 text-white/75 hover:text-white ${FOCUS_DARK}`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
           
            <Link
              href="/login"
              className={`rounded-md px-5 text-sm font-semibold text-white min-h-[44px] flex items-center transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:scale-95 ${FOCUS_DARK}`}
              style={{ backgroundColor: C.gold }}
            >
              Sign in
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className={`md:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm ${FOCUS_DARK}`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="mobile-nav"
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X    size={22} aria-hidden="true" />
              : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        role="navigation"
        aria-label="Mobile navigation"
        className="md:hidden border-t overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          borderColor:     C.maroonLight,
          backgroundColor: C.maroonDark,
          maxHeight:       mobileOpen ? '420px' : '0px',
          opacity:         mobileOpen ? 1 : 0,
        }}
      >
        <div className="px-6 py-5 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`py-3 text-base font-medium min-h-[44px] flex items-center border-b rounded-sm text-white/80 hover:text-white transition-colors ${FOCUS_DARK}`}
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              {label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className={`mt-4 w-full py-3.5 rounded-md text-white font-semibold text-sm min-h-[44px] flex items-center justify-center transition-all hover:brightness-110 active:scale-95 ${FOCUS_DARK}`}
            style={{ backgroundColor: C.gold }}
          >
            Access System
          </Link>
        </div>
      </div>
    </header>
  )
}
