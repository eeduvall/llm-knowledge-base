'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { QuestionCard } from '@/components/picker/QuestionCard';
import { ResultDeck } from '@/components/picker/ResultDeck';
import {
  QUESTIONS,
  getNextQuestion,
  isFunnelComplete,
  getRecommendations,
} from '@/lib/decision-tree';
import type { UserAnswers, ScoredModel } from '@/lib/decision-tree';
import { useQuery } from '@tanstack/react-query';
import type { Model } from '@/lib/models';

async function fetchModels(): Promise<Model[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = (await res.json()) as { models: Model[] };
  return data.models;
}

export default function PickerPage() {
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [recommendations, setRecommendations] = useState<ScoredModel[] | null>(null);

  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  const handleAnswer = useCallback(
    (questionId: string, answerId: string) => {
      const next = { ...answers, [questionId]: answerId };
      setAnswers(next);

      if (isFunnelComplete(next)) {
        const recs = getRecommendations(models, next);
        setRecommendations(recs);
      }
    },
    [answers, models],
  );

  const handleReset = useCallback(() => {
    setAnswers({});
    setRecommendations(null);
  }, []);

  const currentQuestion = getNextQuestion(answers);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />

      <div className="flex flex-col items-center px-6 pt-28 pb-24">
        {/* Page header */}
        <div className="w-full max-w-xl mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Find your model
          </h1>
          <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
            Answer a few questions and get a ranked shortlist with plain-English explanations.
          </p>
        </div>

        {/* Wizard content */}
        {recommendations !== null ? (
          <ResultDeck results={recommendations} onReset={handleReset} />
        ) : currentQuestion !== null ? (
          <QuestionCard
            question={currentQuestion}
            selectedAnswerId={answers[currentQuestion.id] ?? null}
            onAnswer={handleAnswer}
            questionNumber={answeredCount + 1}
            totalQuestions={totalQuestions}
          />
        ) : null}
      </div>
    </main>
  );
}
