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
};

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-1 py-1 text-left group"
        aria-expanded={open}
      >
        <span
          className="text-xs font-mono font-medium tracking-widest uppercase"
          style={{ color: 'var(--color-text-faint)' }}
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
            color: 'var(--color-text-faint)',
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

      {open && <div className="flex flex-col gap-1 mt-1">{children}</div>}
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
      className="w-fit px-3 py-1 rounded text-xs font-mono font-medium capitalize transition-all duration-200"
      style={{
        backgroundColor: active ? `${color}22` : 'var(--color-pill-bg)',
        color: active ? color : 'var(--color-text-muted)',
        border: `1px solid ${active ? color + '44' : 'var(--color-pill-border)'}`,
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

// ─── Capability icon hints ────────────────────────────────────────────────────

const CAPABILITY_COLORS: Record<string, string> = {
  reasoning: '#6C63FF',
  vision: '#00D4FF',
  'tool-use': '#FF6B9D',
  'structured-output': '#F7B731',
  code: '#9B8FFF',
  'long-context': '#00D4FF',
};

const MODALITY_COLORS: Record<string, string> = {
  text: '#6C63FF',
  image: '#00D4FF',
  audio: '#FF6B9D',
  video: '#F7B731',
  code: '#9B8FFF',
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
}: Props) {
  return (
    <aside
      className="absolute top-0 left-0 h-full z-10 flex flex-col overflow-y-auto"
      style={{
        width: '13rem',
        backgroundColor: 'var(--color-overlay)',
        borderRight: '1px solid var(--color-border)',
      }}
      aria-label="Graph filters"
    >
      {/* Panel header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span
          className="text-xs font-mono font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          Explorer
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 flex-1">
        {/* ── Search ── */}
        <div className="relative">
          <label htmlFor="graph-search" className="sr-only">Search models</label>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-faint)' }}
          >
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            id="graph-search"
            type="search"
            placeholder="Search models…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-2 text-xs rounded outline-none transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-input-bg)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* ── Provider ── */}
        <div role="group" aria-label="Filter by provider">
          <Section title="Provider">
            <Pill
              label="All"
              active={activeProvider === null}
              color="var(--color-primary)"
              onClick={() => onSelectProvider(null)}
            />
            {providers.map((provider) => {
              const color = PROVIDER_COLORS[provider] ?? '#6C63FF';
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
        </div>

        {/* ── Capability ── */}
        <Section title="Capability" defaultOpen={true}>
          {capabilities.map((cap) => {
            const color = CAPABILITY_COLORS[cap] ?? '#6C63FF';
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
            const color = MODALITY_COLORS[mod] ?? '#6C63FF';
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
              color="#9B8FFF"
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
      {(activeProvider !== null ||
        activeCapabilities.length > 0 ||
        activeModalities.length > 0 ||
        activeLicenses.length > 0) && (
        <div
          className="px-4 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={() => {
              onSelectProvider(null);
              activeCapabilities.forEach(onToggleCapability);
              activeModalities.forEach(onToggleModality);
              activeLicenses.forEach(onToggleLicense);
            }}
            className="text-xs font-mono transition-colors duration-200"
            style={{ color: 'var(--color-accent)' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </aside>
  );
}