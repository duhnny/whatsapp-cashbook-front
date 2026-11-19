import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { type Category } from '../../lib/categories'
import { formatCompactCurrency, formatCurrency } from '../../lib/format'
import { useChartTheme } from '../../lib/chartTheme'
import ChartTooltip from './ChartTooltip'

export interface DonutSlice {
  category: Category | 'everything_else'
  label: string
  total: number
}

function channel(value: number): number {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

// Dimmed slices blend with the surface at their fillOpacity, so label ink must
// be picked against that blended color, not the saturated one.
function blendOver(hex: string, surface: string, alpha: number): string {
  const fg = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
  const bg = [1, 3, 5].map((index) => parseInt(surface.slice(index, index + 2), 16))
  const mixed = fg.map((value, index) => Math.round(value * alpha + bg[index] * (1 - alpha)))

  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

// On-slice labels flip between the two inside fills by the slice's own
// luminance, so the percent always reads >= 4.5:1 against its background.
function labelInk(hex: string, chrome: { insideFill: string; insideFillOnYellow: string }): string {
  const r = channel(parseInt(hex.slice(1, 3), 16) / 255)
  const g = channel(parseInt(hex.slice(3, 5), 16) / 255)
  const b = channel(parseInt(hex.slice(5, 7), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  return luminance >= 0.2 ? chrome.insideFillOnYellow : chrome.insideFill
}

interface CategoryDonutProps {
  slices: DonutSlice[]
  activeCategories: Category[]
  onToggle: (category: Category) => void
}

// Always renders the full net-negative set (it ignores the category filter —
// it is the selector). Slices outside the active selection dim instead of
// disappearing, so the distribution stays honest; identity colors never move.
export default function CategoryDonut({ slices, activeCategories, onToggle }: CategoryDonutProps) {
  const { colors, chrome } = useChartTheme()

  if (slices.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        No expenses in this period.
      </p>
    )
  }

  const total = slices.reduce((sum, slice) => sum + slice.total, 0)
  const hasSelection = activeCategories.length > 0

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative h-64 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={slices}
              dataKey="total"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={1.5}
              stroke={chrome.surface}
              strokeWidth={2}
              isAnimationActive={false}
              onClick={(_, index) => {
                const slice = slices[index]
                if (slice && slice.category !== 'everything_else') {
                  onToggle(slice.category)
                }
              }}
              label={({ percent, midAngle, middleRadius, cx, cy, payload }) => {
                if (
                  percent === undefined ||
                  percent < 0.08 ||
                  midAngle === undefined ||
                  middleRadius === undefined ||
                  cx === undefined ||
                  cy === undefined
                ) {
                  return null
                }
                const slice = payload as DonutSlice
                const radian = Math.PI / 180
                const x = cx + middleRadius * Math.cos(-midAngle * radian)
                const y = cy + middleRadius * Math.sin(-midAngle * radian)
                const fill = slice.category === 'everything_else' ? colors.others : colors[slice.category]
                const dimmed =
                  hasSelection && slice.category !== 'everything_else' && !activeCategories.includes(slice.category)
                const background = dimmed ? blendOver(fill, chrome.surface, 0.25) : fill

                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={600}
                    fill={labelInk(background, chrome)}
                  >
                    {`${Math.round(percent * 100)}%`}
                  </text>
                )
              }}
              labelLine={false}
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.category}
                  fill={slice.category === 'everything_else' ? colors.others : colors[slice.category]}
                  fillOpacity={
                    hasSelection && slice.category !== 'everything_else' && !activeCategories.includes(slice.category)
                      ? 0.25
                      : 1
                  }
                  cursor={slice.category === 'everything_else' ? 'default' : 'pointer'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Spent</p>
          <p className="text-xl font-semibold text-neutral-900 dark:text-white">{formatCompactCurrency(total)}</p>
        </div>
      </div>
      <ul className="w-full space-y-1.5 sm:w-48">
        {slices.map((slice) => {
          const share = total > 0 ? slice.total / total : 0

          return (
            <li
              key={slice.category}
              title={`${slice.label}: ${formatCurrency(slice.total)}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: slice.category === 'everything_else' ? colors.others : colors[slice.category],
                  }}
                />
                <span className="truncate text-neutral-700 dark:text-neutral-300">{slice.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">
                {(share * 100).toFixed(1)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
