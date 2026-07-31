import { render, screen, fireEvent } from '@testing-library/react'
import { AnswerButton } from './AnswerButton'
import type { Answer } from '@/lib/decision-tree'

const answer: Answer = {
  id: 'chatbot',
  label: 'Customer-facing chatbot',
  hint: 'Conversational UI, support, Q&A',
}

describe('AnswerButton', () => {
  it('renders the answer label', () => {
    render(<AnswerButton answer={answer} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Customer-facing chatbot')).toBeInTheDocument()
  })

  it('renders the hint text when provided', () => {
    render(<AnswerButton answer={answer} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Conversational UI, support, Q&A')).toBeInTheDocument()
  })

  it('does not render hint when not provided', () => {
    const noHint: Answer = { id: 'x', label: 'No hint answer' }
    render(<AnswerButton answer={noHint} selected={false} onSelect={() => {}} />)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('calls onSelect with the answer id when clicked', () => {
    const onSelect = jest.fn()
    render(<AnswerButton answer={answer} selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('chatbot')
  })

  it('sets aria-pressed to true when selected', () => {
    render(<AnswerButton answer={answer} selected={true} onSelect={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets aria-pressed to false when not selected', () => {
    render(<AnswerButton answer={answer} selected={false} onSelect={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })
})
