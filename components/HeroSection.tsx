'use client';

import Link from 'next/link';
import { GraphAnimation } from './GraphAnimation';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Background gradient — decorative */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(108,99,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 60%, rgba(0,212,255,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-2">
        {/* Left: text content */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <div className="inline-flex w-fit items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-widest"
              style={{
                borderColor: 'rgba(0,212,255,0.4)',
                color: '#00D4FF',
                backgroundColor: 'rgba(0,212,255,0.06)',
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: '#00D4FF' }}
                aria-hidden="true"
              />
              55 Models · Updated Daily
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-7xl font-extrabold leading-[0.9] tracking-tight text-white md:text-8xl"
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
          <p className="max-w-sm text-base leading-relaxed text-white/60">
            A living map of the language-model landscape — models pulled together by what they can
            actually do, not by who markets them hardest. Orbit the graph, or let twelve questions
            do the work.
          </p>

          {/* CTAs */}
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/graph"
              className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
              style={{ backgroundColor: '#6C63FF' }}
            >
              Explore the graph
              <span aria-hidden="true"> →</span>
            </Link>
            <Link
              href="/picker"
              className="inline-flex items-center gap-2 rounded border px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.25)' }}
            >
              Answer 12 questions
            </Link>
          </div>

          {/* Provider list */}
          <div className="mt-4 flex flex-wrap items-center gap-4" aria-label="Supported providers">
            {['OpenAI', 'Anthropic', 'Meta', 'Mistral', 'Google', '+31 OSS'].map((provider) => (
              <span
                key={provider}
                className="font-mono text-xs font-medium uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {provider}
              </span>
            ))}
          </div>
        </div>

        {/* Right: animated graph — decorative, motion respects prefers-reduced-motion via CSS */}
        <div className="relative h-[480px] w-full lg:h-[600px]" aria-hidden="true">
          <GraphAnimation />
        </div>
      </div>
    </section>
  );
}
