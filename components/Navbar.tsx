'use client';

import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme'

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
          <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.18" />
          <stop offset="70%"  stopColor="var(--color-secondary)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0"    />
        </radialGradient>
        {/* Bright core glow */}
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff"  stopOpacity="1"   />
          <stop offset="45%"  stopColor="var(--color-primary)"  stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-bg)"  stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* Outer diffuse halo */}
      <ellipse cx="14" cy="14" rx="13" ry="13" fill="url(#halo)" />

      {/* Galactic disc — outer ring, tilted ~20 ° */}
      <ellipse
        cx="14"
        cy="14"
        rx="11"
        ry="4.5"
        stroke="var(--color-primary)"
        strokeWidth="1.4"
        strokeOpacity="0.7"
        fill="none"
        transform="rotate(-20 14 14)"
      />

      {/* Galactic disc — mid ring */}
      <ellipse
        cx="14"
        cy="14"
        rx="7.5"
        ry="3"
        stroke="var(--color-secondary)"
        strokeWidth="1.1"
        strokeOpacity="0.65"
        fill="none"
        transform="rotate(-20 14 14)"
      />

      {/* Faint inner disc fill to suggest the bulge */}
      <ellipse
        cx="14"
        cy="14"
        rx="5"
        ry="2"
        fill="var(--color-primary)"
        fillOpacity="0.12"
        transform="rotate(-20 14 14)"
      />

      {/* Star dots — scattered around the disc plane */}
      <circle cx="4"  cy="11" r="0.7" fill="var(--color-secondary)" opacity="0.85" />
      <circle cx="24" cy="17" r="0.7" fill="var(--color-primary)" opacity="0.85" />
      <circle cx="7"  cy="18" r="0.55" fill="var(--color-primary)" opacity="0.7" />
      <circle cx="21" cy="10" r="0.55" fill="var(--color-secondary)" opacity="0.7" />
      <circle cx="3"  cy="15" r="0.45" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="25" cy="13" r="0.45" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="10" cy="6"  r="0.4"  fill="#ffffff"  opacity="0.5" />
      <circle cx="18" cy="22" r="0.4"  fill="#ffffff"  opacity="0.5" />

      {/* Bright galactic core */}
      <circle cx="14" cy="14" r="3" fill="url(#core)" />
      {/* Core pinpoint highlight */}
      <circle cx="13.3" cy="13.3" r="0.9" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

/** Sun icon for light mode */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Moon icon for dark mode */
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10A6 6 0 016 2.5a6 6 0 100 11 6 6 0 007.5-3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--color-nav-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group" aria-label="LLM Knowledge Base home">
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
        <ul className="hidden md:flex items-center gap-8 list-none">
          {(['Graph', 'Picker', 'Models', 'Compare', 'Changelog'] as const).map((item) => (
            <li key={item}>
              <Link
                href={item === 'Compare' ? '/comparison' : `/${item.toLowerCase()}`}
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={theme === 'light'}
          className="flex items-center justify-center w-8 h-8 rounded transition-colors duration-200"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <Link
          href="/sign-in"
          className="text-sm font-medium rounded px-4 py-1.5 transition-all duration-200"
          style={{
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}