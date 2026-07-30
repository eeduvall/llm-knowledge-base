'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/useTheme'

/** Inline SVG galaxy logo — tilted elliptical disc with glowing core.
 *  The disc shape reads clearly at 28 × 28 px where spiral arms become
 *  indistinct.  Uses only design-system palette colors defined in
 *  styles/globals.css.  Dynamic radial-gradient values are the only inline
 *  styles (cannot be expressed as static Tailwind classes per AGENTS.md §6).
 */
function GalaxyLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Galaxy logo"
      role="img"
    >
      <defs>
        {/* Soft outer halo */}
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#6C63FF" stopOpacity="0.18" />
          <stop offset="70%"  stopColor="#00D4FF" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#050510" stopOpacity="0"    />
        </radialGradient>
        {/* Bright core glow */}
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff"  stopOpacity="1"   />
          <stop offset="45%"  stopColor="#6C63FF"  stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050510"  stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* Outer diffuse halo */}
      <ellipse cx="14" cy="14" rx="13" ry="13" fill="url(#halo)" />

      {/* Galactic disc — outer ring, tilted ~20 ° */}
      <ellipse
        cx="14" cy="14"
        rx="11" ry="4.5"
        stroke="#6C63FF"
        strokeWidth="1.4"
        strokeOpacity="0.7"
        fill="none"
        transform="rotate(-20 14 14)"
      />

      {/* Galactic disc — mid ring */}
      <ellipse
        cx="14" cy="14"
        rx="7.5" ry="3"
        stroke="#00D4FF"
        strokeWidth="1.1"
        strokeOpacity="0.65"
        fill="none"
        transform="rotate(-20 14 14)"
      />

      {/* Faint inner disc fill to suggest the bulge */}
      <ellipse
        cx="14" cy="14"
        rx="5" ry="2"
        fill="#6C63FF"
        fillOpacity="0.12"
        transform="rotate(-20 14 14)"
      />

      {/* Star dots — scattered around the disc plane */}
      <circle cx="4"  cy="11" r="0.7" fill="#00D4FF" opacity="0.85" />
      <circle cx="24" cy="17" r="0.7" fill="#6C63FF" opacity="0.85" />
      <circle cx="7"  cy="18" r="0.55" fill="#6C63FF" opacity="0.7" />
      <circle cx="21" cy="10" r="0.55" fill="#00D4FF" opacity="0.7" />
      <circle cx="3"  cy="15" r="0.45" fill="#FF6B9D" opacity="0.6" />
      <circle cx="25" cy="13" r="0.45" fill="#FF6B9D" opacity="0.6" />
      <circle cx="10" cy="6"  r="0.4"  fill="#ffffff"  opacity="0.5" />
      <circle cx="18" cy="22" r="0.4"  fill="#ffffff"  opacity="0.5" />

      {/* Bright galactic core */}
      <circle cx="14" cy="14" r="3" fill="url(#core)" />
      {/* Core pinpoint highlight */}
      <circle cx="13.3" cy="13.3" r="0.9" fill="#ffffff" opacity="0.95" />
    </svg>
  )
}

/** Sun icon for light mode */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.66" y1="11.66" x2="13.07" y2="13.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.93" y1="13.07" x2="4.34" y2="11.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.66" y1="4.34" x2="13.07" y2="2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Moon icon for dark mode */
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--color-bg-nav)',
        borderColor: 'var(--color-border-nav)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 flex items-center justify-center" aria-hidden="true">
          <GalaxyLogo />
        </div>
        <span
          className="font-display font-bold text-base tracking-tight"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--color-text)' }}
        >
          LLM Knowledge Base
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-8">
          {(['Graph', 'Picker', 'Models', 'Changelog'] as const).map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-nav)' }}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded transition-all duration-200"
          style={{
            color: 'var(--color-text-nav)',
            border: '1px solid var(--color-border-sign-in)',
          }}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <Link
          href="/sign-in"
          className="text-sm font-medium rounded px-4 py-1.5 transition-all duration-200"
          style={{
            color: 'var(--color-text)',
            border: '1px solid var(--color-border-sign-in)',
          }}
        >
          Sign in
        </Link>
      </div>
    </nav>
  )
}
