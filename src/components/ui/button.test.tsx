import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('applies the default variant classes', () => {
    render(<Button>Default</Button>)
    const button = screen.getByText('Default')
    expect(button.className).toContain('bg-primary')
  })

  it('applies the correct size variant classes', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByText('Large')
    expect(button.className).toContain('h-9')
  })
})
