import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Progress } from './progress'

describe('Progress Component', () => {
  it('renders correctly with a value', () => {
    const { container } = render(<Progress value={50} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    
    expect(progressBar).toBeDefined()
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('50')
  })
})
