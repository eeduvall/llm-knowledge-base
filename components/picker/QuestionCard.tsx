"use client"

import { AnswerButton } from './AnswerButton'
import type { Question, AnswerId } from '@/lib/decision-tree'

type Props = {
  question: Question
  selectedAnswerId: AnswerId | null
  onAnswer: (questionId: string, answerId: AnswerId) => void
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({
  question,
  selectedAnswerId,
  onAnswer,
  questionNumber,
  totalQuestions,
}: Props) {
  return (
    <section
      className="w-full max-w-xl mx-auto flex flex-col gap-6"
      aria-label={`Question ${questionNumber} of ${totalQuestions}`}
    >
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {questionNumber} / {totalQuestions}
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-px transition-all duration-500"
            style={{
              width: `${(questionNumber / totalQuestions) * 100}%`,
              backgroundColor: 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* Question text */}
      <h2
        className="text-2xl font-semibold leading-snug"
        style={{ color: 'var(--color-text)' }}
      >
        {question.text}
      </h2>

      {/* Answer options */}
      <div className="flex flex-col gap-3" role="group" aria-label="Answer options">
        {question.answers.map((answer) => (
          <AnswerButton
            key={answer.id}
            answer={answer}
            selected={selectedAnswerId === answer.id}
            onSelect={(id) => onAnswer(question.id, id)}
          />
        ))}
      </div>
    </section>
  )
}
