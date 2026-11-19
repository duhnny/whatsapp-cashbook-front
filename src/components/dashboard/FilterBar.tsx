import { CATEGORIES, type Category } from '../../lib/categories'
import { useChartTheme } from '../../lib/chartTheme'
import type { DashboardFilters } from '../../lib/filters'

const controlClass =
  'rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'

interface FilterBarProps {
  filters: DashboardFilters
  onChange: (filters: DashboardFilters) => void
}

// One row above everything the filters scope: period first, then the category
// chips. The donut ignores the category selection (it is the selector), so its
// slices stay put while everything below re-renders against the same slice.
export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const { colors } = useChartTheme()

  const toggleCategory = (category: Category) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category]
    onChange({ ...filters, categories })
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dashboard filters">
      <select
        aria-label="Period"
        value={filters.preset}
        onChange={(event) =>
          onChange({
            ...filters,
            preset: event.target.value as DashboardFilters['preset'],
            start: undefined,
            end: undefined,
          })
        }
        className={controlClass}
      >
        <option value="this week">This week</option>
        <option value="this month">This month</option>
        <option value="past week">Past week</option>
        <option value="past month">Past month</option>
        <option value="custom">Custom range…</option>
      </select>

      {filters.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Start date"
            value={filters.start ?? ''}
            max={filters.end}
            onChange={(event) => onChange({ ...filters, start: event.target.value || undefined })}
            className={controlClass}
          />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">to</span>
          <input
            type="date"
            aria-label="End date"
            value={filters.end ?? ''}
            min={filters.start}
            onChange={(event) => onChange({ ...filters, end: event.target.value || undefined })}
            className={controlClass}
          />
        </div>
      )}

      {filters.categories.length > 0 && (
        <span className="mx-1 hidden h-5 w-px bg-neutral-200 dark:bg-neutral-800 sm:block" aria-hidden="true" />
      )}

      {CATEGORIES.map(({ value, label }) => {
        const active = filters.categories.includes(value)

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => toggleCategory(value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
              active
                ? 'border-neutral-900 text-neutral-900 ring-1 ring-neutral-900 dark:border-neutral-50 dark:text-neutral-50 dark:ring-1 dark:ring-neutral-50'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[value] }}
            />
            {label}
          </button>
        )
      })}

      {filters.categories.length > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...filters, categories: [] })}
          className="px-1 text-sm text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          Clear
        </button>
      )}
    </div>
  )
}
