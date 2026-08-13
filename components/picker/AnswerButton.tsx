'use client';

import type { Answer } from '@/lib/decision-tree';

type Props = {
  answer: Answer;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function AnswerButton({ answer, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(answer.id)}
      className="w-full rounded-xl border px-5 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: selected ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.04)',
        borderColor: selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
        color: 'var(--color-text)',
      }}
      aria-pressed={selected}
    >
      <span className="block text-sm font-medium">{answer.label}</span>
      {answer.hint && (
        <span className="mt-1 block text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {answer.hint}
        </span>
      )}
    </button>
  );
}
