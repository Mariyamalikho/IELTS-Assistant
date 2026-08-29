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

  it('handles the asChild prop correctly', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByText('Link Button')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/test')
  })
})
