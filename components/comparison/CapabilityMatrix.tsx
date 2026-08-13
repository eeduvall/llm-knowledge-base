'use client';

import type { Model } from '@/lib/models';

type Props = {
  models: Model[];
};

// All known capabilities across the dataset — rendered as rows
const ALL_CAPABILITIES = [
  'reasoning',
  'vision',
  'tool-use',
  'structured-output',
  'code',
  'long-context',
  'quantizable',
  'fine-tuning',
  'in-context-learning',
] as const;

// All known modalities
const ALL_MODALITIES = ['text', 'image', 'audio', 'video', 'code'] as const;

type CellState = 'yes' | 'no';

function Cell({ state }: { state: CellState }) {
  if (state === 'yes') {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
        style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--color-secondary)' }}
        aria-label="Supported"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
      style={{ background: 'rgba(255,107,157,0.10)', color: 'var(--color-text-faint)' }}
      aria-label="Not supported"
    >
      ✕
    </span>
  );
}

export function CapabilityMatrix({ models }: Props) {
  if (models.length === 0) return null;

  // Collect all capabilities that appear in at least one selected model
  const presentCapabilities = ALL_CAPABILITIES.filter((cap) =>
    models.some((m) => m.capabilities.includes(cap)),
  );

  // Collect all modalities that appear in at least one selected model
  const presentModalities = ALL_MODALITIES.filter((mod) =>
    models.some((m) => m.modalities.includes(mod)),
  );

  const headerStyle: React.CSSProperties = {
    color: 'var(--color-text-muted)',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
  };

  const rowStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--color-divider)',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    color: 'var(--color-primary)',
    background: 'var(--color-panel-bg-alt)',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {/* Feature label column */}
              <th
                className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest w-48"
                style={headerStyle}
              >
                Feature
              </th>
              {models.map((m) => (
                <th
                  key={m.id}
                  className="px-4 py-3 text-center text-xs font-semibold"
                  style={headerStyle}
                >
                  <div style={{ color: 'var(--color-text)' }}>{m.name}</div>
                  <div
                    className="text-xs font-normal mt-0.5"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {m.provider}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ── Capabilities section ── */}
            <tr>
              <td colSpan={models.length + 1} className="px-4 py-2" style={sectionHeaderStyle}>
                Capabilities
              </td>
            </tr>

            {presentCapabilities.map((cap) => (
              <tr key={cap} style={rowStyle}>
                <td
                  className="px-4 py-3 font-medium capitalize"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {cap.replace(/-/g, ' ')}
                </td>
                {models.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <Cell state={m.capabilities.includes(cap) ? 'yes' : 'no'} />
                  </td>
                ))}
              </tr>
            ))}

            {/* ── Modalities section ── */}
            <tr>
              <td colSpan={models.length + 1} className="px-4 py-2" style={sectionHeaderStyle}>
                Modalities
              </td>
            </tr>

            {presentModalities.map((mod) => (
              <tr key={mod} style={rowStyle}>
                <td
                  className="px-4 py-3 font-medium capitalize"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {mod}
                </td>
                {models.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <Cell state={m.modalities.includes(mod) ? 'yes' : 'no'} />
                  </td>
                ))}
              </tr>
            ))}

            {/* ── License section ── */}
            <tr>
              <td colSpan={models.length + 1} className="px-4 py-2" style={sectionHeaderStyle}>
                License
              </td>
            </tr>

            <tr style={rowStyle}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                License type
              </td>
              {models.map((m) => (
                <td key={m.id} className="px-4 py-3 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background:
                        m.license === 'proprietary'
                          ? 'rgba(255,107,157,0.12)'
                          : 'rgba(0,212,255,0.12)',
                      color:
                        m.license === 'proprietary'
                          ? 'var(--color-accent)'
                          : 'var(--color-secondary)',
                    }}
                  >
                    {m.license}
                  </span>
                </td>
              ))}
            </tr>

            {/* ── Context window section ── */}
            <tr>
              <td colSpan={models.length + 1} className="px-4 py-2" style={sectionHeaderStyle}>
                Context
              </td>
            </tr>

            <tr style={rowStyle}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Context window
              </td>
              {models.map((m) => {
                const maxCtx = Math.max(...models.map((x) => x.context_window));
                const isBest = m.context_window === maxCtx;
                return (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isBest ? 'var(--color-secondary)' : 'var(--color-text)',
                      }}
                    >
                      {isBest && '👑 '}
                      {m.context_window >= 1_000_000
                        ? `${(m.context_window / 1_000_000).toFixed(1)}M`
                        : `${(m.context_window / 1_000).toFixed(0)}K`}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
