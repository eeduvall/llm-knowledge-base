'use client'

import Link from 'next/link'

/** Inline SVG galaxy logo — spiral arms, star dots, glowing core.
 *  Uses only design-system palette colors defined in styles/globals.css.
 *  Dynamic radial-gradient values are the only inline styles (cannot be
 *  expressed as static Tailwind classes per AGENTS.md §6).
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
        {/* Radial glow for the core */}
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#6C63FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050510" stopOpacity="0" />
        </radialGradient>
        {/* Outer haze */}
        <radialGradient id="outerHaze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#050510" stopOpacity="0" />
        </radialGradient>
        {/* Arm gradient — primary to secondary */}
        <linearGradient id="armGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="armGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Outer diffuse haze */}
      <circle cx="14" cy="14" r="13" fill="url(#outerHaze)" />

      {/* Spiral arm 1 — sweeps from lower-left to upper-right */}
      <path
        d="M 4 20 Q 8 14 14 14 Q 20 14 22 8"
        stroke="url(#armGrad1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Spiral arm 2 — counter-sweep */}
      <path
        d="M 24 20 Q 20 14 14 14 Q 8 14 6 8"
        stroke="url(#armGrad2)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Thinner outer arm extension 1 */}
      <path
        d="M 2 16 Q 6 13 10 12"
        stroke="#6C63FF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Thinner outer arm extension 2 */}
      <path
        d="M 26 16 Q 22 13 18 12"
        stroke="#00D4FF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Star dots scattered in the arms */}
      <circle cx="6"  cy="21" r="0.8" fill="#00D4FF" opacity="0.9" />
      <circle cx="9"  cy="18" r="0.6" fill="#6C63FF" opacity="0.8" />
      <circle cx="20" cy="9"  r="0.8" fill="#6C63FF" opacity="0.9" />
      <circle cx="22" cy="19" r="0.7" fill="#00D4FF" opacity="0.8" />
      <circle cx="5"  cy="12" r="0.5" fill="#FF6B9D" opacity="0.7" />
      <circle cx="23" cy="12" r="0.5" fill="#FF6B9D" opacity="0.7" />
      <circle cx="11" cy="8"  r="0.6" fill="#00D4FF" opacity="0.6" />
      <circle cx="17" cy="20" r="0.6" fill="#6C63FF" opacity="0.6" />
      <circle cx="8"  cy="10" r="0.4" fill="#ffffff"  opacity="0.5" />
      <circle cx="20" cy="18" r="0.4" fill="#ffffff"  opacity="0.5" />

      {/* Bright galactic core */}
      <circle cx="14" cy="14" r="3.5" fill="url(#coreGlow)" />
      {/* Core highlight */}
      <circle cx="13" cy="13" r="1" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

export function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(5, 5, 16, 0.85)' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group" aria-label="LLM Knowledge Base home">
        <div className="w-7 h-7 flex items-center justify-center">
          <GalaxyLogo />
        </div>
        <span
          className="font-display font-bold text-white text-base tracking-tight"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          LLM Knowledge Base
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        <ul className="hidden md:flex items-center gap-8 list-none">
          {(['Graph', 'Picker', 'Models', 'Changelog'] as const).map((item) => (
            <li key={item}>
              <Link
                href={`/${item.toLowerCase()}`}
                className="text-sm text-white/70 hover:text-white transition-colors duration-200"
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-white border border-white/30 rounded px-4 py-1.5 hover:border-white/60 hover:bg-white/5 transition-all duration-200"
        >
          Sign in
        </Link>
      </div>
    </nav>
  )
}