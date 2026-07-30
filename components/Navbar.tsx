'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(5, 5, 16, 0.85)' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group" aria-label="LLM Knowledge Base home">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle at 40% 40%, #6C63FF, #00D4FF)' }}
          aria-hidden="true"
        >
          <div className="w-3 h-3 rounded-full bg-white/20" />
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
