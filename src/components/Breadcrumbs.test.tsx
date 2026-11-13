import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs component', () => {
  it('does not render on /dashboard', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Breadcrumbs />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders breadcrumb links when on an inner page like /reading', () => {
    render(
      <MemoryRouter initialEntries={['/reading']}>
        <Breadcrumbs />
      </MemoryRouter>
    )

    const nav = screen.getByRole('navigation', { name: /breadcrumbs/i })
    expect(nav).toBeTruthy()
    expect(screen.getByText('Dashboard')).toBeTruthy()
    expect(screen.getByText('Reading Practice')).toBeTruthy()
  })

  it('renders breadcrumb links when on /writing', () => {
    render(
      <MemoryRouter initialEntries={['/writing']}>
        <Breadcrumbs />
      </MemoryRouter>
    )

    expect(screen.getByText('Writing Evaluation')).toBeTruthy()
  })
})
