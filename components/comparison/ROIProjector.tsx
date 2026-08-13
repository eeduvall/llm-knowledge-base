'use client';

import { useState } from 'react';
import type { Model } from '@/lib/models';
import { calculateROI, DEFAULT_TASK_TOKENS } from '@/lib/cost-calculator';
import type { TaskType } from '@/lib/cost-calculator';

type Props = {
  models: Model[];
};

const TASK_LABELS: Record<TaskType, string> = {
  document_analysis: 'Document Analysis',
  chat_turn: 'Chat Turn',
  code_review: 'Code Review',
  summarization: 'Summarization',
  classification: 'Classification',
  custom: 'Custom',
};

function formatLargeCost(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function SavingsBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const isPositive = percent > 0;
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full ml-2"
      style={{
        background: isPositive ? 'rgba(0,212,255,0.12)' : 'rgba(255,107,157,0.12)',
        color: isPositive ? 'var(--color-secondary)' : 'var(--color-accent)',
        border: `1px solid ${isPositive ? 'rgba(0,212,255,0.3)' : 'rgba(255,107,157,0.3)'}`,
      }}
    >
      {isPositive ? '▼' : '▲'} {Math.abs(percent).toFixed(1)}%
    </span>
  );
}

export function ROIProjector({ models }: Props) {
  const pricedModels = models.filter((m) => m.pricing.input !== null);

  const [baselineId, setBaselineId] = useState<string>(pricedModels[0]?.id ?? '');
  const [taskType, setTaskType] = useState<TaskType>('document_analysis');
  const [inputTokens, setInputTokens] = useState<number>(
    DEFAULT_TASK_TOKENS.document_analysis.input,
  );
  const [outputTokens, setOutputTokens] = useState<number>(
    DEFAULT_TASK_TOKENS.document_analysis.output,
  );
  const [tasksPerMonth, setTasksPerMonth] = useState<number>(10_000);

  function handleTaskTypeChange(t: TaskType) {
    setTaskType(t);
    setInputTokens(DEFAULT_TASK_TOKENS[t].input);
    setOutputTokens(DEFAULT_TASK_TOKENS[t].output);
  }

  const baselineModel = models.find((m) => m.id === baselineId);
  const alternatives = models.filter((m) => m.id !== baselineId);

  if (models.length < 2) {
    return (
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          ROI Projector
        </h2>
        <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-faint)' }}>
          Select at least 2 models to project ROI.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 sm:p-6"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
        ROI Projector
      </h2>
      <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
        Compare potential savings of switching from a baseline model to alternatives.
      </p>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Baseline model */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roi-baseline"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Baseline Model
          </label>
          <select
            id="roi-baseline"
            value={baselineId}
            onChange={(e) => setBaselineId(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
            style={{
              background: 'var(--color-panel-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Task type */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roi-task-type"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Task Type
          </label>
          <select
            id="roi-task-type"
            value={taskType}
            onChange={(e) => handleTaskTypeChange(e.target.value as TaskType)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
            style={{
              background: 'var(--color-panel-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {(Object.keys(TASK_LABELS) as TaskType[]).map((t) => (
              <option key={t} value={t}>
                {TASK_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Tasks per month */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roi-tasks-per-month"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Tasks / Month
          </label>
          <input
            id="roi-tasks-per-month"
            type="number"
            min={1}
            value={tasksPerMonth}
            onChange={(e) => setTasksPerMonth(Math.max(1, Number(e.target.value)))}
            className="rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2"
            style={{
              background: 'var(--color-panel-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* Token inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roi-input-tokens"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Input Tokens / Task
          </label>
          <input
            id="roi-input-tokens"
            type="number"
            min={1}
            value={inputTokens}
            onChange={(e) => setInputTokens(Math.max(1, Number(e.target.value)))}
            className="rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2"
            style={{
              background: 'var(--color-panel-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="roi-output-tokens"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Output Tokens / Task
          </label>
          <input
            id="roi-output-tokens"
            type="number"
            min={1}
            value={outputTokens}
            onChange={(e) => setOutputTokens(Math.max(1, Number(e.target.value)))}
            className="rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2"
            style={{
              background: 'var(--color-panel-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* ROI cards */}
      {!baselineModel ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-faint)' }}>
          Select a baseline model to see ROI projections.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {alternatives.map((alt) => {
            const roi = calculateROI(baselineModel, alt, tasksPerMonth, inputTokens, outputTokens);
            const hasSavings = roi.monthlySavings !== null;
            const isPositive = (roi.monthlySavings ?? 0) > 0;

            return (
              <div
                key={alt.id}
                className="rounded-lg p-4"
                style={{
                  background: 'var(--color-panel-bg)',
                  border: `1px solid ${isPositive && hasSavings ? 'rgba(0,212,255,0.25)' : 'var(--color-border)'}`,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {baselineModel.name}
                    </span>
                    <span className="mx-2 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      →
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      {alt.name}
                    </span>
                  </div>
                  {hasSavings && <SavingsBadge percent={roi.savingsPercent} />}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Baseline / mo
                    </span>
                    <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                      {formatLargeCost(roi.baselineMonthlySpend)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Alternative / mo
                    </span>
                    <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                      {alt.pricing.input === null
                        ? 'Self-hosted'
                        : formatLargeCost(roi.alternativeMonthlySpend)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Monthly savings
                    </span>
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{
                        color:
                          isPositive && hasSavings
                            ? 'var(--color-secondary)'
                            : hasSavings
                              ? 'var(--color-accent)'
                              : 'var(--color-text-faint)',
                      }}
                    >
                      {hasSavings
                        ? `${(roi.monthlySavings ?? 0) >= 0 ? '+' : ''}${formatLargeCost(roi.monthlySavings)}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Annual savings
                    </span>
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{
                        color:
                          isPositive && hasSavings
                            ? 'var(--color-secondary)'
                            : hasSavings
                              ? 'var(--color-accent)'
                              : 'var(--color-text-faint)',
                      }}
                    >
                      {hasSavings
                        ? `${(roi.annualSavings ?? 0) >= 0 ? '+' : ''}${formatLargeCost(roi.annualSavings)}`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Capability gaps */}
                {roi.capabilityGaps.length > 0 && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: '1px solid var(--color-divider)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                      ⚠ Capability gaps:{' '}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {roi.capabilityGaps.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs mt-4" style={{ color: 'var(--color-text-faint)' }}>
        Projections are based on model pricing metadata. Open-weights models require self-hosted
        infrastructure costs not reflected here.
      </p>
    </div>
  );
}
