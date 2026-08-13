'use client';

import { useState } from 'react';
import { PROVIDER_COLORS } from '@/lib/models';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClusterMode = 'family' | 'provider' | 'cost-tier' | 'modality' | 'benchmark';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

type Props = {
  // Search
  searchQuery: string;
  onSearch: (query: string) => void;

  // Provider filter
  providers: string[];
  activeProvider: string | null;
  onSelectProvider: (provider: string | null) => void;

  // Capability filter
  capabilities: string[];
  activeCapabilities: string[];
  onToggleCapability: (cap: string) => void;

  // Modality filter
  modalities: string[];
  activeModalities: string[];
  onToggleModality: (mod: string) => void;

  // License filter
  licenses: string[];
  activeLicenses: string[];
  onToggleLicense: (lic: string) => void;

  // Cluster mode
  clusterMode: ClusterMode;
  onSetClusterMode: (mode: ClusterMode) => void;

  // Clear all filters
  onClearAllFilters: () => void;
};

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between px-1 py-1 text-left"
        aria-expanded={open}
      >
        <span
          className="font-mono text-xs font-medium uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {title}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          <path
            d="M1 3l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && <div className="mt-1 flex flex-col gap-1">{children}</div>}
    </div>
  );
}

// ─── Pill button ──────────────────────────────────────────────────────────────

type PillProps = {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
};

function Pill({ label, active, color = 'var(--color-primary)', onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      className="w-fit rounded px-3 py-1 font-mono text-xs font-medium capitalize transition-all duration-200"
      style={{
        backgroundColor: active ? `${color}22` : 'rgba(255,255,255,0.05)',
        color: active ? color : 'rgba(255,255,255,0.5)',
        border: `1px solid ${active ? color + '44' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {label}
    </button>
  );
}

// ─── Cluster mode labels ──────────────────────────────────────────────────────

const CLUSTER_OPTIONS: { value: ClusterMode; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'provider', label: 'Provider' },
  { value: 'cost-tier', label: 'Cost tier' },
  { value: 'modality', label: 'Modality' },
  { value: 'benchmark', label: 'Benchmark' },
];

// ─── Capability and modality color maps ───────────────────────────────────────
// All values reference CSS custom properties defined in styles/globals.css.
// Never use bare hex literals here — add a token to globals.css if needed.

const CAPABILITY_COLORS: Record<string, string> = {
  reasoning: 'var(--color-primary)',
  vision: 'var(--color-secondary)',
  'tool-use': 'var(--color-accent)',
  'structured-output': 'var(--color-warning)',
  code: 'var(--color-primary-light)',
  'long-context': 'var(--color-secondary)',
};

const MODALITY_COLORS: Record<string, string> = {
  text: 'var(--color-primary)',
  image: 'var(--color-secondary)',
  audio: 'var(--color-accent)',
  video: 'var(--color-warning)',
  code: 'var(--color-primary-light)',
};

// ─── Main component ───────────────────────────────────────────────────────────

export function FilterBar({
  searchQuery,
  onSearch,
  providers,
  activeProvider,
  onSelectProvider,
  capabilities,
  activeCapabilities,
  onToggleCapability,
  modalities,
  activeModalities,
  onToggleModality,
  licenses,
  activeLicenses,
  onToggleLicense,
  clusterMode,
  onSetClusterMode,
  onClearAllFilters,
}: Props) {
  const hasActiveFilters =
    activeProvider !== null ||
    activeCapabilities.length > 0 ||
    activeModalities.length > 0 ||
    activeLicenses.length > 0;

  return (
    <aside
      className="absolute left-0 top-0 z-10 flex h-full flex-col overflow-y-auto"
      style={{
        width: '13rem',
        backgroundColor: 'rgba(5,5,16,0.88)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
      aria-label="Graph filters"
    >
      {/* Panel header */}
      <div
        className="flex-shrink-0 border-b px-4 py-3"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <span
          className="font-mono text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-primary)' }}
        >
          Explorer
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* ── Search ── */}
        <div className="relative">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search models…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded py-2 pl-7 pr-3 text-xs text-white placeholder-white/30 outline-none transition-colors duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            aria-label="Search models"
          />
        </div>

        {/* ── Provider ── */}
        <Section title="Provider">
          <Pill
            label="All"
            active={activeProvider === null}
            color="var(--color-primary)"
            onClick={() => onSelectProvider(null)}
          />
          {providers.map((provider) => {
            const color = PROVIDER_COLORS[provider] ?? 'var(--color-primary)';
            return (
              <Pill
                key={provider}
                label={provider}
                active={activeProvider === provider}
                color={color}
                onClick={() => onSelectProvider(activeProvider === provider ? null : provider)}
              />
            );
          })}
        </Section>

        {/* ── Capability ── */}
        <Section title="Capability" defaultOpen={true}>
          {capabilities.map((cap) => {
            const color = CAPABILITY_COLORS[cap] ?? 'var(--color-primary)';
            return (
              <Pill
                key={cap}
                label={cap}
                active={activeCapabilities.includes(cap)}
                color={color}
                onClick={() => onToggleCapability(cap)}
              />
            );
          })}
        </Section>

        {/* ── Modality ── */}
        <Section title="Modality" defaultOpen={false}>
          {modalities.map((mod) => {
            const color = MODALITY_COLORS[mod] ?? 'var(--color-primary)';
            return (
              <Pill
                key={mod}
                label={mod}
                active={activeModalities.includes(mod)}
                color={color}
                onClick={() => onToggleModality(mod)}
              />
            );
          })}
        </Section>

        {/* ── License ── */}
        <Section title="License" defaultOpen={false}>
          {licenses.map((lic) => (
            <Pill
              key={lic}
              label={lic}
              active={activeLicenses.includes(lic)}
              color="var(--color-primary-light)"
              onClick={() => onToggleLicense(lic)}
            />
          ))}
        </Section>

        {/* ── Cluster by ── */}
        <Section title="Cluster by" defaultOpen={false}>
          {CLUSTER_OPTIONS.map(({ value, label }) => (
            <Pill
              key={value}
              label={label}
              active={clusterMode === value}
              color="var(--color-secondary)"
              onClick={() => onSetClusterMode(value)}
            />
          ))}
        </Section>
      </div>

      {/* Active filter summary badge */}
      {hasActiveFilters && (
        <div
          className="flex-shrink-0 border-t px-4 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={onClearAllFilters}
            className="font-mono text-xs transition-colors duration-200"
            style={{ color: 'var(--color-accent)' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </aside>
  );
}
