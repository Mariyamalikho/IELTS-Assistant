import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Task1Visual, { normalizeTask1Data, synthesizeTask1Data } from './Task1Visual'

describe('Task1Visual Data Normalization & Synthesis', () => {
  it('synthesizes internet access data for the user prompt', () => {
    const prompt = 'The chart below shows the percentage of households with access to the internet in four countries between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
    const data = synthesizeTask1Data(prompt)
    
    expect(data.chartType).toBe('line')
    expect(data.chartTitle).toContain('Internet Access')
    expect(data.categories).toEqual(['2005', '2010', '2015', '2020'])
    expect(data.series.length).toBe(4)
    expect(data.series.map(s => s.name)).toContain('United Kingdom')
  })

  it('normalizes legacy Chart.js format into Recharts format', () => {
    const legacy = {
      prompt: 'Test prompt',
      chartConfig: {
        type: 'bar',
        data: {
          labels: ['2010', '2015', '2020'],
          datasets: [
            { label: 'Europe', data: [10, 20, 30] },
            { label: 'Asia', data: [15, 25, 35] }
          ]
        },
        options: { title: { text: 'Car Sales' } }
      }
    }
    const data = normalizeTask1Data(legacy)
    expect(data.chartType).toBe('bar')
    expect(data.chartTitle).toBe('Car Sales')
    expect(data.categories).toEqual(['2010', '2015', '2020'])
    expect(data.series.length).toBe(2)
    expect(data.series[0].name).toBe('Europe')
    expect(data.series[0].data).toEqual([10, 20, 30])
  })

  it('preserves native categories and series', () => {
    const native = {
      prompt: 'Test prompt',
      chartType: 'pie',
      chartTitle: 'Energy Sources',
      categories: ['Solar', 'Wind'],
      series: [{ name: 'Output', data: [40, 60] }]
    }
    const data = normalizeTask1Data(native)
    expect(data.chartType).toBe('pie')
    expect(data.chartTitle).toBe('Energy Sources')
    expect(data.categories).toEqual(['Solar', 'Wind'])
    expect(data.series[0].data).toEqual([40, 60])
  })

  it('renders the component and displays chart title and view toggles', () => {
    const prompt = 'The chart below shows the percentage of households with access to the internet in four countries between 2005 and 2020.'
    render(<Task1Visual promptData={{ prompt }} />)
    
    expect(screen.getByText(/Internet Access/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Chart/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Table/i })).toBeDefined()
  })
})
