'use client';

import { useState } from 'react';
import type { Model } from '@/lib/models';
import {
  calculateCostPerTask,
  projectMonthlySpend,
  costPerMillion,
  DEFAULT_TASK_TOKENS,
} from '@/lib/cost-calculator';
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

function formatCost(value: number | null, decimals = 4): string {
  if (value === null) return '—';
  if (value === 0) return '$0.00';
  if (value < 0.0001) return `< $0.0001`;
  return `$${value.toFixed(decimals)}`;
}

function formatLargeCost(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function CostCalculator({ models }: Props) {
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

  const pricedModels = models.filter((m) => m.pricing.input !== null || m.pricing.output !== null);

  return (
    <div
      className="rounded-xl p-5 sm:p-6"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
        Cost-Per-Task Calculator
      </h2>
      <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
        Estimate the cost of running your workload across selected models.
      </p>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Task type */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-type"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Task Type
          </label>
          <select
            id="task-type"
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

        {/* Input tokens */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="input-tokens"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Input Tokens / Task
          </label>
          <input
            id="input-tokens"
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

        {/* Output tokens */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="output-tokens"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Output Tokens / Task
          </label>
          <input
            id="output-tokens"
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

        {/* Tasks per month */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="tasks-per-month"
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Tasks / Month
          </label>
          <input
            id="tasks-per-month"
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

      {/* Results table */}
      {models.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-faint)' }}>
          Select models above to see cost estimates.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-lg"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <table className="w-full text-sm border-collapse" style={{ minWidth: '560px' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--color-panel-bg-alt)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <th
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Model
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Cost / Task
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Cost / 1M Tasks
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Monthly Spend
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Annual Spend
                </th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, idx) => {
                const perTask = calculateCostPerTask(model, {
                  taskType,
                  inputTokens,
                  outputTokens,
                });
                const monthly = projectMonthlySpend(
                  model,
                  tasksPerMonth,
                  inputTokens,
                  outputTokens,
                );
                const perMillion = costPerMillion(model, inputTokens, outputTokens);
                const hasPrice = model.pricing.input !== null || model.pricing.output !== null;

                // Find cheapest monthly spend among priced models for highlighting
                const cheapestMonthly =
                  pricedModels.length > 0
                    ? Math.min(
                        ...pricedModels.map(
                          (m) =>
                            projectMonthlySpend(m, tasksPerMonth, inputTokens, outputTokens)
                              .monthlySpend ?? Infinity,
                        ),
                      )
                    : null;

                const isCheapest =
                  monthly.monthlySpend !== null &&
                  cheapestMonthly !== null &&
                  monthly.monthlySpend === cheapestMonthly &&
                  pricedModels.length > 1;

                return (
                  <tr
                    key={model.id}
                    style={{
                      borderBottom:
                        idx < models.length - 1 ? '1px solid var(--color-divider)' : 'none',
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                          {model.provider}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color: hasPrice ? 'var(--color-text)' : 'var(--color-text-faint)',
                      }}
                    >
                      {hasPrice ? formatCost(perTask.costPerTask) : 'Open weights'}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color: hasPrice ? 'var(--color-text)' : 'var(--color-text-faint)',
                      }}
                    >
                      {hasPrice ? formatLargeCost(perMillion) : '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color: isCheapest
                          ? 'var(--color-secondary)'
                          : hasPrice
                            ? 'var(--color-text)'
                            : 'var(--color-text-faint)',
                        fontWeight: isCheapest ? '600' : undefined,
                      }}
                    >
                      {hasPrice ? formatLargeCost(monthly.monthlySpend) : 'Self-hosted'}
                      {isCheapest && <span className="ml-1 text-xs">👑</span>}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color: isCheapest
                          ? 'var(--color-secondary)'
                          : hasPrice
                            ? 'var(--color-text)'
                            : 'var(--color-text-faint)',
                        fontWeight: isCheapest ? '600' : undefined,
                      }}
                    >
                      {hasPrice ? formatLargeCost(monthly.annualSpend) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--color-text-faint)' }}>
        Prices are per 1M tokens from model metadata. Actual costs may vary. Open-weights models
        require self-hosted infrastructure.
      </p>
    </div>
  );
}
