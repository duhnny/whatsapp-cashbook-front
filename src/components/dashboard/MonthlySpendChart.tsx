import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  formatCompactCurrency,
  formatMonth,
  formatMonthWithYear,
  formatWholeCurrency,
} from '../../lib/format'
import { useChartTheme } from '../../lib/chartTheme'
import ChartTooltip from './ChartTooltip'

export interface MonthRow {
  month: Date
  total: number
}

// Single series, so slot 1 blue and no legend box — the title names it.
export default function MonthlySpendChart({ rows }: { rows: MonthRow[] }) {
  const { colors, chrome } = useChartTheme()

  if (rows.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        No expenses yet — the monthly view fills in as you spend.
      </p>
    )
  }

  const data = rows.map((row, index) => {
    const previous = rows[index - 1] ? new Date(rows[index - 1].month) : null
    const showYear = previous === null || previous.getUTCFullYear() !== row.month.getUTCFullYear()

    return {
      ...row,
      label: showYear ? formatMonthWithYear(row.month) : formatMonth(row.month),
    }
  })

  const axisMax = Math.max(...data.map((row) => row.total))
  const formatAxisTick = (value: number) =>
    axisMax >= 10000 ? formatCompactCurrency(value) : formatWholeCurrency(value)

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid vertical={false} stroke={chrome.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: chrome.axis }}
          tick={{ fill: chrome.axis, fontSize: 12 }}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: chrome.axis, fontSize: 12 }}
          tickFormatter={formatAxisTick}
          width={56}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: chrome.cursor }} />
        <Bar dataKey="total" name="Spent" fill={colors.payment} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
