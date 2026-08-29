import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card Component', () => {
  it('renders a complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Card Title')).toBeDefined()
    expect(screen.getByText('Card Description')).toBeDefined()
    expect(screen.getByText('Card Content')).toBeDefined()
    expect(screen.getByText('Card Footer')).toBeDefined()
  })
})
