import { render, screen } from '@testing-library/react';
import { Navbar } from './Navbar';

// next/link renders a standard <a> tag in the test environment
describe('Navbar', () => {
  it('renders the brand name', () => {
    render(<Navbar />);
    expect(screen.getByText('LLM Knowledge Base')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Picker')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('renders the sign-in link', () => {
    render(<Navbar />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
