import type { TooltipContentProps } from 'recharts'

import { formatCurrency } from '../../lib/format'

// Values lead, labels follow; identity rides a short stroke of the series
// color, never the text itself.
export default function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="min-w-40 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      {label ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p> : null}
      {payload.map((entry, index) => {
        const color = entry.color ?? (entry.payload as { color?: string } | undefined)?.color

        return (
          <p key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              {color ? (
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              ) : null}
              {entry.name}
            </span>
            <strong className="font-semibold tabular-nums text-neutral-900 dark:text-white">
              {formatCurrency(Number(entry.value))}
            </strong>
          </p>
        )
      })}
    </div>
  )
}
