export interface Task1Series {
  name: string
  data: number[]
  color?: string
}

export interface Task1VisualData {
  chartType: 'line' | 'bar' | 'pie'
  chartTitle: string
  xAxisLabel?: string
  yAxisLabel?: string
  categories: string[]
  series: Task1Series[]
}

export const DEFAULT_TASK1_PALETTE = [
  '#2563eb', // blue
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#e11d48', // rose
  '#0891b2', // cyan
  '#ca8a04', // yellow/amber
  '#4f46e5'  // indigo
]

/**
 * Synthesizes an authentic IELTS dataset based on the prompt's subject and time periods.
 */
export function synthesizeTask1Data(promptText: string = ''): Task1VisualData {
  const lower = promptText.toLowerCase()

  // 1. Internet / Technology access across countries
  if (lower.includes('internet') || lower.includes('technology') || lower.includes('broadband')) {
    const is2005To2020 = lower.includes('2005') || lower.includes('2020')
    const categories = is2005To2020 
      ? ['2005', '2010', '2015', '2020'] 
      : ['2000', '2005', '2010', '2015', '2020']

    return {
      chartType: 'line',
      chartTitle: 'Percentage of Households with Internet Access (2005–2020)',
      xAxisLabel: 'Year',
      yAxisLabel: 'Households with Access (%)',
      categories,
      series: [
        { name: 'United Kingdom', data: is2005To2020 ? [60, 75, 88, 95] : [40, 60, 75, 88, 95] },
        { name: 'United States', data: is2005To2020 ? [68, 79, 87, 93] : [50, 68, 79, 87, 93] },
        { name: 'Germany', data: is2005To2020 ? [58, 72, 85, 91] : [38, 58, 72, 85, 91] },
        { name: 'Canada', data: is2005To2020 ? [62, 77, 86, 92] : [45, 62, 77, 86, 92] }
      ]
    }
  }

  // 2. Tourism / Travel / Caribbean
  if (lower.includes('tourist') || lower.includes('visitor') || lower.includes('caribbean') || lower.includes('travel')) {
    return {
      chartType: 'line',
      chartTitle: 'Tourist Visits to a Caribbean Island (2010–2017)',
      xAxisLabel: 'Year',
      yAxisLabel: 'Visitors (Millions)',
      categories: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'],
      series: [
        { name: 'Total Visitors', data: [1.0, 1.5, 1.2, 1.8, 2.0, 2.5, 2.6, 3.0] }
      ]
    }
  }

  // 3. Vehicles / Transport / Car sales
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('transport') || lower.includes('fuel')) {
    return {
      chartType: 'bar',
      chartTitle: 'Car Sales by Engine Type (Market Share %)',
      xAxisLabel: 'Engine Type',
      yAxisLabel: 'Market Share (%)',
      categories: ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
      series: [
        { name: '2015', data: [65, 25, 7, 3] },
        { name: '2020', data: [42, 18, 18, 22] }
      ]
    }
  }

  // 4. Energy / Electricity / Environment
  if (lower.includes('energy') || lower.includes('electricity') || lower.includes('consumption') || lower.includes('power')) {
    return {
      chartType: 'bar',
      chartTitle: 'Electricity Production by Source (in Gigawatt-hours)',
      xAxisLabel: 'Energy Source',
      yAxisLabel: 'Production (GWh)',
      categories: ['Solar', 'Wind', 'Hydro', 'Natural Gas', 'Coal'],
      series: [
        { name: '2010', data: [15, 30, 85, 140, 190] },
        { name: '2020', data: [75, 95, 90, 160, 110] }
      ]
    }
  }

  // 5. University / Graduates / Education
  if (lower.includes('university') || lower.includes('graduate') || lower.includes('education') || lower.includes('student')) {
    return {
      chartType: 'bar',
      chartTitle: 'Employment Destinations of Recent University Graduates',
      xAxisLabel: 'Field of Study',
      yAxisLabel: 'Percentage (%)',
      categories: ['Arts & Humanities', 'Natural Sciences', 'Business', 'Engineering'],
      series: [
        { name: 'Full-time Employment', data: [55, 72, 82, 88] },
        { name: 'Further Study', data: [25, 18, 10, 7] },
        { name: 'Seeking Employment', data: [20, 10, 8, 5] }
      ]
    }
  }

  // 6. Pie chart / Distribution / Proportion
  if (lower.includes('pie') || lower.includes('proportion') || lower.includes('expenditure') || lower.includes('spending')) {
    return {
      chartType: 'pie',
      chartTitle: 'Household Expenditure Distribution',
      xAxisLabel: 'Category',
      yAxisLabel: 'Percentage (%)',
      categories: ['Housing', 'Food & Drink', 'Transport', 'Recreation', 'Other'],
      series: [
        { name: 'Expenditure', data: [32, 22, 18, 15, 13] }
      ]
    }
  }

  // 7. General fallback: extract years or use standard IELTS multi-country line graph
  const yearMatches = promptText.match(/\b(19\d\d|20\d\d)\b/g)
  let categories = ['2000', '2005', '2010', '2015', '2020']
  if (yearMatches && yearMatches.length >= 2) {
    const startYear = parseInt(yearMatches[0], 10)
    const endYear = parseInt(yearMatches[yearMatches.length - 1], 10)
    if (endYear > startYear && endYear - startYear >= 3) {
      const step = Math.max(1, Math.round((endYear - startYear) / 4))
      const generated: string[] = []
      for (let y = startYear; y < endYear; y += step) {
        generated.push(y.toString())
      }
      if (!generated.includes(endYear.toString())) {
        generated.push(endYear.toString())
      }
      categories = generated
    }
  }

  return {
    chartType: 'line',
    chartTitle: 'Comparative Trends Across Four Countries',
    xAxisLabel: 'Year',
    yAxisLabel: 'Percentage / Metric Units',
    categories,
    series: [
      { name: 'Country A', data: categories.map((_, i) => Math.round(30 + i * 12 + (i % 2) * 3)) },
      { name: 'Country B', data: categories.map((_, i) => Math.round(50 + i * 8 - (i % 2) * 2)) },
      { name: 'Country C', data: categories.map((_, i) => Math.round(20 + i * 15)) },
      { name: 'Country D', data: categories.map((_, i) => Math.round(65 + i * 5 + (i % 3) * 2)) }
    ]
  }
}

/**
 * Safely parses any input format (Gemini response, legacy Chart.js, or raw prompt)
 * into a valid Task1VisualData structure.
 */
export function normalizeTask1Data(data: any): Task1VisualData {
  if (!data) return synthesizeTask1Data('')

  // Case A: Structured native format with categories and series
  if (
    Array.isArray(data.categories) && 
    data.categories.length > 0 && 
    Array.isArray(data.series) && 
    data.series.length > 0 &&
    Array.isArray(data.series[0]?.data)
  ) {
    let type: 'line' | 'bar' | 'pie' = 'line'
    if (data.chartType === 'bar' || data.chartType === 'pie') {
      type = data.chartType
    }
    return {
      chartType: type,
      chartTitle: data.chartTitle || 'IELTS Academic Writing Task 1',
      xAxisLabel: data.xAxisLabel,
      yAxisLabel: data.yAxisLabel,
      categories: data.categories.map(String),
      series: data.series.map((s: any, idx: number) => ({
        name: s.name || `Series ${idx + 1}`,
        data: Array.isArray(s.data) ? s.data.map(Number) : [],
        color: s.color || DEFAULT_TASK1_PALETTE[idx % DEFAULT_TASK1_PALETTE.length]
      }))
    }
  }

  // Case B: Legacy Chart.js format (chartConfig: { type, data: { labels, datasets } })
  const config = data.chartConfig || (data.data?.labels ? data : null)
  if (config?.data?.labels && Array.isArray(config.data.labels) && Array.isArray(config.data.datasets)) {
    const rawType = (config.type || '').toLowerCase()
    const chartType: 'line' | 'bar' | 'pie' = rawType.includes('bar') ? 'bar' : rawType.includes('pie') ? 'pie' : 'line'
    const categories = config.data.labels.map(String)
    const series = config.data.datasets.map((ds: any, idx: number) => ({
      name: ds.label || `Dataset ${idx + 1}`,
      data: Array.isArray(ds.data) ? ds.data.map(Number) : [],
      color: ds.borderColor || ds.backgroundColor || DEFAULT_TASK1_PALETTE[idx % DEFAULT_TASK1_PALETTE.length]
    }))

    return {
      chartType,
      chartTitle: config.options?.title?.text || data.chartTitle || 'IELTS Academic Writing Task 1',
      xAxisLabel: data.xAxisLabel,
      yAxisLabel: data.yAxisLabel,
      categories,
      series
    }
  }

  // Case C: Missing visual data — synthesize matching data from prompt text
  const promptText = typeof data === 'string' ? data : (data.prompt || '')
  return synthesizeTask1Data(promptText)
}
