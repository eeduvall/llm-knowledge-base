import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';
import type { Question } from '@/lib/decision-tree';

const question: Question = {
  id: 'use_case',
  text: 'What are you building?',
  answers: [
    { id: 'chatbot', label: 'Customer-facing chatbot', hint: 'Conversational UI' },
    { id: 'code', label: 'Code assistant', hint: 'Autocomplete, review' },
  ],
};

describe('QuestionCard', () => {
  it('renders the question text', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId={null}
        onAnswer={() => {}}
        questionNumber={1}
        totalQuestions={6}
      />,
    );
    expect(screen.getByText('What are you building?')).toBeInTheDocument();
  });

  it('renders all answer options', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId={null}
        onAnswer={() => {}}
        questionNumber={1}
        totalQuestions={6}
      />,
    );
    expect(screen.getByText('Customer-facing chatbot')).toBeInTheDocument();
    expect(screen.getByText('Code assistant')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId={null}
        onAnswer={() => {}}
        questionNumber={2}
        totalQuestions={6}
      />,
    );
    expect(screen.getByText('2 / 6')).toBeInTheDocument();
  });

  it('calls onAnswer with question id and answer id when an answer is clicked', () => {
    const onAnswer = jest.fn();
    render(
      <QuestionCard
        question={question}
        selectedAnswerId={null}
        onAnswer={onAnswer}
        questionNumber={1}
        totalQuestions={6}
      />,
    );
    fireEvent.click(screen.getByText('Customer-facing chatbot'));
    expect(onAnswer).toHaveBeenCalledWith('use_case', 'chatbot');
  });

  it('marks the selected answer as pressed', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId="chatbot"
        onAnswer={() => {}}
        questionNumber={1}
        totalQuestions={6}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const chatbotBtn = buttons.find((b) => b.textContent?.includes('Customer-facing chatbot'));
    expect(chatbotBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
