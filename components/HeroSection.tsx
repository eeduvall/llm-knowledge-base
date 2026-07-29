'use client'

import Link from 'next/link'
import { GraphAnimation } from './GraphAnimation'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(108,99,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 60%, rgba(0,212,255,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-16">
        {/* Left: text content */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 w-fit">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium tracking-widest uppercase"
              style={{
                borderColor: 'rgba(0,212,255,0.4)',
                color: '#00D4FF',
                backgroundColor: 'rgba(0,212,255,0.06)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: '#00D4FF' }}
              />
              55 Models · Updated Daily
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-7xl md:text-8xl font-extrabold leading-[0.9] tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Stop
            <br />
            guessing
            <br />
            which
            <br />
            model
            <br />
            to ship.
          </h1>

          {/* Subtext */}
          <p className="text-base text-white/60 max-w-sm leading-relaxed">
            A living map of the language-model landscape — models pulled
            together by what they can actually do, not by who markets them
            hardest. Orbit the graph, or let twelve questions do the work.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/graph"
              className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: '#6C63FF' }}
            >
              Explore the graph →
            </Link>
            <Link
              href="/picker"
              className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm text-white border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.25)' }}
            >
              Answer 12 questions
            </Link>
          </div>

          {/* Provider list */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {['OpenAI', 'Anthropic', 'Meta', 'Mistral', 'Google', '+31 OSS'].map(
              (provider) => (
                <span
                  key={provider}
                  className="text-xs font-mono font-medium tracking-widest uppercase"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {provider}
                </span>
              )
            )}
          </div>
        </div>

        {/* Right: animated graph */}
        <div className="relative h-[480px] lg:h-[600px] w-full">
          <GraphAnimation />
        </div>
      </div>
    </section>
  )
}
