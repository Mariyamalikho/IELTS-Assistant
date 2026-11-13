import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { PageMeta } from './PageMeta'

describe('PageMeta component', () => {
  beforeEach(() => {
    document.title = 'Default Title'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.remove()
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.remove()
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.remove()
  })

  it('updates document.title and og:title', () => {
    render(<PageMeta title="Academic Reading" />)
    expect(document.title).toBe('Academic Reading | IELTS Assistant')
  })

  it('creates and updates meta description', () => {
    render(
      <PageMeta
        title="Writing Assessment"
        description="Comprehensive IELTS Writing Task evaluation."
      />
    )
    const meta = document.querySelector('meta[name="description"]')
    expect(meta).not.toBeNull()
    expect(meta?.getAttribute('content')).toBe('Comprehensive IELTS Writing Task evaluation.')
  })

  it('updates canonical link tag', () => {
    render(
      <PageMeta
        title="Candidate Simulation"
        canonicalPath="/simulation"
      />
    )
    const canonical = document.querySelector('link[rel="canonical"]')
    expect(canonical).not.toBeNull()
    expect(canonical?.getAttribute('href')).toBe('https://ielts-assistant.vercel.app/simulation')
  })
})
