'use client';

import { useCallback } from 'react';
import type { Model } from '@/lib/models';
import { exportComparisonAsCSV } from '@/lib/export';

type Props = {
  models: Model[];
  disabled?: boolean;
};

export function ExportButton({ models, disabled = false }: Props) {
  const handleExport = useCallback(() => {
    if (models.length === 0) return;
    exportComparisonAsCSV(models);
  }, [models]);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || models.length === 0}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border focus:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
      aria-label="Export comparison as CSV"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M7 1v8M4 6l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Export CSV
    </button>
  );
}
