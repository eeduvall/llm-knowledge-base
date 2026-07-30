import { render, screen } from '@testing-library/react'
import { FeaturesSection } from './FeaturesSection'

describe('FeaturesSection', () => {
  it('renders all three feature cards', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Similarity, not marketing')).toBeInTheDocument()
    expect(screen.getByText('Every number, one panel')).toBeInTheDocument()
    expect(screen.getByText('A shortlist in two minutes')).toBeInTheDocument()
  })

  it('renders feature tags', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/Cluster/i)).toBeInTheDocument()
    expect(screen.getByText(/Dossier/i)).toBeInTheDocument()
    expect(screen.getByText(/Picker/i)).toBeInTheDocument()
  })

  it('renders feature numbers', () => {
    render(<FeaturesSection />)
    expect(screen.getByText(/01/)).toBeInTheDocument()
    expect(screen.getByText(/02/)).toBeInTheDocument()
    expect(screen.getByText(/03/)).toBeInTheDocument()
  })
})
