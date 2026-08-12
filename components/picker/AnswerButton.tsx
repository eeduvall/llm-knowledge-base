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
      className="w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: selected ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.04)',
        borderColor: selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
        color: 'var(--color-text)',
      }}
      aria-pressed={selected}
    >
      <span className="block font-medium text-sm">{answer.label}</span>
      {answer.hint && (
        <span className="block text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {answer.hint}
        </span>
      )}
    </button>
  );
}
