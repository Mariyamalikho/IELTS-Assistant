import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Table, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

import {
  type Task1Series,
  type Task1VisualData,
  DEFAULT_TASK1_PALETTE,
  synthesizeTask1Data,
  normalizeTask1Data
} from '@/lib/task1-visual'

export {
  synthesizeTask1Data,
  normalizeTask1Data
}
export type { Task1Series, Task1VisualData }

interface Task1VisualProps {
  promptData: any
  className?: string
}

export function Task1Visual({ promptData, className = '' }: Task1VisualProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  const visualData = useMemo(() => normalizeTask1Data(promptData), [promptData])
  const { chartType, chartTitle, xAxisLabel, yAxisLabel, categories, series } = visualData

  // Prepare Recharts data format: array of objects with { name: category, [seriesName]: value }
  const rechartsData = useMemo(() => {
    return categories.map((cat, catIdx) => {
      const item: Record<string, any> = { name: cat }
      series.forEach((s) => {
        item[s.name] = s.data[catIdx] ?? 0
      })
      return item
    })
  }, [categories, series])

  // Prepare PieChart data format: { name, value }
  const pieData = useMemo(() => {
    if (chartType !== 'pie') return []
    // If pie, take first series and map against categories
    const primarySeries = series[0]
    if (!primarySeries) return []
    return categories.map((cat, idx) => ({
      name: cat,
      value: primarySeries.data[idx] ?? 0
    }))
  }, [chartType, categories, series])

  return (
    <Card className={`border shadow-sm overflow-hidden bg-card/60 backdrop-blur-xs ${className}`}>
      <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {chartType === 'line' && <TrendingUp className="w-5 h-5 text-primary shrink-0" />}
          {chartType === 'bar' && <BarChart3 className="w-5 h-5 text-primary shrink-0" />}
          {chartType === 'pie' && <PieIcon className="w-5 h-5 text-primary shrink-0" />}
          <CardTitle className="text-base sm:text-lg font-semibold truncate text-foreground">
            {chartTitle}
          </CardTitle>
        </div>

        {/* View Switcher: Chart vs Data Table */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg shrink-0">
          <Button
            type="button"
            variant={viewMode === 'chart' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chart</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode('table')}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {viewMode === 'chart' ? (
          <div className="w-full h-[320px] sm:h-[360px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={rechartsData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10, fontSize: 12, fill: 'currentColor' } : undefined}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0, fontSize: 12, fill: 'currentColor' } : undefined}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(var(--card))', 
                      borderColor: 'oklch(var(--border))', 
                      borderRadius: '8px',
                      color: 'oklch(var(--card-foreground))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px' }} />
                  {series.map((s, idx) => (
                    <Line
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={s.color || DEFAULT_TASK1_PALETTE[idx % DEFAULT_TASK1_PALETTE.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart data={rechartsData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10, fontSize: 12, fill: 'currentColor' } : undefined}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0, fontSize: 12, fill: 'currentColor' } : undefined}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(var(--card))', 
                      borderColor: 'oklch(var(--border))', 
                      borderRadius: '8px',
                      color: 'oklch(var(--card-foreground))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px' }} />
                  {series.map((s, idx) => (
                    <Bar
                      key={s.name}
                      dataKey={s.name}
                      fill={s.color || DEFAULT_TASK1_PALETTE[idx % DEFAULT_TASK1_PALETTE.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              ) : (
                <PieChart>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(var(--card))', 
                      borderColor: 'oklch(var(--border))', 
                      borderRadius: '8px',
                      color: 'oklch(var(--card-foreground))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px' }} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DEFAULT_TASK1_PALETTE[index % DEFAULT_TASK1_PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {xAxisLabel || 'Category / Series'}
                  </th>
                  {categories.map((cat) => (
                    <th key={cat} scope="col" className="px-4 py-3 font-semibold text-center">
                      {cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {series.map((s, idx) => (
                  <tr key={s.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 inline-block" 
                        style={{ backgroundColor: s.color || DEFAULT_TASK1_PALETTE[idx % DEFAULT_TASK1_PALETTE.length] }} 
                      />
                      <span>{s.name}</span>
                    </td>
                    {s.data.map((val, catIdx) => (
                      <td key={catIdx} className="px-4 py-3 text-center text-muted-foreground font-mono">
                        {val}
                        {yAxisLabel?.includes('%') ? '%' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export default Task1Visual
