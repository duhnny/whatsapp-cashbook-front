import type { GetTransactionsSummaryRequestQuery } from '@duhnny/whatsapp-cashbook-api'

import { isCategory, type Category } from './categories'

export type IntervalPreset = 'this week' | 'this month' | 'past week' | 'past month'

export type DashboardFilters = {
  preset: IntervalPreset | 'custom'
  /** yyyy-mm-dd, only set when preset is 'custom' */
  start?: string
  end?: string
  categories: Category[]
}

const PRESETS: ReadonlyArray<IntervalPreset> = ['this week', 'this month', 'past week', 'past month']

export function parseFilters(params: URLSearchParams): DashboardFilters {
  const when = params.get('when')
  const start = params.get('start')
  const end = params.get('end')

  const preset: IntervalPreset | 'custom' =
    start || end
      ? 'custom'
      : PRESETS.includes(when as IntervalPreset)
        ? (when as IntervalPreset)
        : 'this month'

  return {
    preset,
    start: preset === 'custom' ? start ?? undefined : undefined,
    end: preset === 'custom' ? end ?? undefined : undefined,
    categories: params.getAll('categories').filter(isCategory),
  }
}

export function toSearchParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.preset === 'custom') {
    if (filters.start) params.set('start', filters.start)
    if (filters.end) params.set('end', filters.end)
  } else {
    params.set('when', filters.preset)
  }

  filters.categories.forEach((category) => params.append('categories', category))

  return params
}

export function toApiQuery(filters: DashboardFilters): GetTransactionsSummaryRequestQuery {
  const query: GetTransactionsSummaryRequestQuery = {}

  if (filters.categories.length > 0) {
    query.categories = filters.categories
  }

  if (filters.preset === 'custom') {
    query.dates = {
      kind: 'between',
      start: filters.start ? new Date(`${filters.start}T00:00:00`) : undefined,
      end: filters.end ? new Date(`${filters.end}T23:59:59.999`) : undefined,
    }
  } else {
    query.dates = { kind: 'relative', when: filters.preset }
  }

  return query
}

export function intervalLabel(filters: DashboardFilters): string {
  switch (filters.preset) {
    case 'custom':
      return filters.start || filters.end ? 'Custom range' : 'All time'
    case 'this week':
      return 'This week'
    case 'this month':
      return 'This month'
    case 'past week':
      return 'Past week'
    case 'past month':
      return 'Past month'
  }
}
