import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useClerk, useUser } from '@clerk/react'

import type {
  GetTransactionsSummaryResponseBody,
  ListTransactionsResponseBody,
} from '@duhnny/whatsapp-cashbook-api'

import { Loading } from '../components/Loading'
import FilterBar from '../components/dashboard/FilterBar'
import CategoryDonut, { type DonutSlice } from '../components/dashboard/CategoryDonut'
import MonthlySpendChart, { type MonthRow } from '../components/dashboard/MonthlySpendChart'
import TransactionsTable, { type TransactionRow } from '../components/dashboard/TransactionsTable'
import { getTransactionsSummary, listTransactions } from '../lib/api'
import { CATEGORY_LABELS, type Category } from '../lib/categories'
import { formatCompactCurrency, formatCurrency } from '../lib/format'
import { clearOnboarding } from '../lib/onboarding'
import { intervalLabel, parseFilters, toApiQuery, toSearchParams } from '../lib/filters'

type SummaryData = Extract<GetTransactionsSummaryResponseBody, { _tag: 'ok' }>['value']
type TransactionsData = Extract<ListTransactionsResponseBody, { _tag: 'ok' }>['value']

type LoadState<T> = { data?: T; loading: boolean; error: boolean }

// The donut keeps 6 slices; the tail folds into "Everything else" so part-to-whole
// stays glanceable. The fold bucket is display-only: chips carry the filter.
const FOLD_AFTER = 6

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const clerk = useClerk()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const [summary, setSummary] = useState<LoadState<SummaryData>>({ loading: true, error: false })
  const [transactions, setTransactions] = useState<LoadState<TransactionsData>>({ loading: true, error: false })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    void Promise.resolve().then(async () => {
      setSummary((state) => ({ ...state, loading: true, error: false }))
      setTransactions((state) => ({ ...state, loading: true, error: false }))

      const token = await getToken()
      if (cancelled) {
        return
      }

      const query = toApiQuery(filters)
      const [summaryResponse, listResponse] = await Promise.all([
        getTransactionsSummary(token, query),
        listTransactions(token, query),
      ])

      if (cancelled) {
        return
      }

      const authFailed = [summaryResponse, listResponse].some(
        (response) =>
          response.body._tag === 'err' &&
          (response.body.error._tag === 'Unauthenticated' || response.body.error._tag === 'MalformedJWT'),
      )
      if (authFailed) {
        await clerk.signOut()
        navigate('/sign-in')
        return
      }

      setSummary(
        summaryResponse.body._tag === 'err'
          ? { loading: false, error: true }
          : { data: summaryResponse.body.value, loading: false, error: false },
      )
      setTransactions(
        listResponse.body._tag === 'err'
          ? { loading: false, error: true }
          : { data: listResponse.body.value, loading: false, error: false },
      )
    })

    return () => {
      cancelled = true
    }
  }, [filters, getToken, clerk, navigate, nonce])

  const toggleCategory = (category: Category) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category]
    setSearchParams(toSearchParams({ ...filters, categories }))
  }

  const spentByPeriod = useMemo(
    () => (summary.data ? summary.data.spendByCategory.reduce((sum, entry) => sum + entry.total, 0) : 0),
    [summary.data],
  )

  const topCategory = useMemo(
    () =>
      summary.data && summary.data.spendByCategory.length > 0
        ? summary.data.spendByCategory.reduce((a, b) => (b.total > a.total ? b : a))
        : undefined,
    [summary.data],
  )

  const donutSlices: DonutSlice[] = useMemo(() => {
    if (!summary.data) {
      return []
    }
    const sorted = [...summary.data.spendByCategory].sort((a, b) => b.total - a.total)
    const slices: DonutSlice[] = sorted.slice(0, FOLD_AFTER).map((entry) => ({
      category: entry.category,
      label: CATEGORY_LABELS[entry.category],
      total: entry.total,
    }))
    const tail = sorted.slice(FOLD_AFTER)
    if (tail.length > 0) {
      slices.push({
        category: 'everything_else',
        label: 'Everything else',
        total: tail.reduce((sum, entry) => sum + entry.total, 0),
      })
    }
    return slices
  }, [summary.data])

  const monthRows: MonthRow[] = useMemo(
    () =>
      summary.data
        ? summary.data.spendByMonth.map((entry) => ({ month: new Date(entry.month), total: entry.total }))
        : [],
    [summary.data],
  )

  const tableRows: TransactionRow[] = useMemo(
    () => [...(transactions.data ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [transactions.data],
  )

  if (!isLoaded) {
    return <Loading />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  if (summary.loading && !summary.data) {
    return <Loading />
  }

  const handleSignOut = async () => {
    clearOnboarding()
    await clerk.signOut()
  }

  const failed = summary.error || transactions.error
  const pending = summary.loading || transactions.loading

  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">WhatsApp Cashbook</h1>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Hi, {user?.firstName ?? 'there'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Your cashbook at a glance.</p>
        </div>

        <FilterBar filters={filters} onChange={(next) => setSearchParams(toSearchParams(next))} />

        {failed ? (
          <ErrorCard onRetry={() => setNonce((value) => value + 1)} />
        ) : (
          <div className={`space-y-6 transition-opacity ${pending ? 'opacity-60' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Current balance
                </p>
                <p className="mt-2 text-5xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                  {formatCurrency(summary.data?.balance ?? 0)}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  All time, as shown by your bank account
                </p>
              </section>
              <StatTile label="Spent" value={formatCompactCurrency(spentByPeriod)} sub={intervalLabel(filters)} />
              <StatTile
                label="Transactions"
                value={String(transactions.data?.length ?? 0)}
                sub={intervalLabel(filters)}
              />
              <StatTile
                label="Top category"
                value={topCategory ? CATEGORY_LABELS[topCategory.category] : '—'}
                sub={topCategory ? formatCurrency(topCategory.total) : 'No expenses'}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Spend by category</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Expenses only, {intervalLabel(filters).toLowerCase()}. Click a slice to toggle the category
                  filter.
                </p>
                <div className="mt-4">
                  <CategoryDonut
                    slices={donutSlices}
                    activeCategories={filters.categories}
                    onToggle={toggleCategory}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-3">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Spent per month</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Every month, regardless of the period filter.
                </p>
                <div className="mt-4">
                  <MonthlySpendChart rows={monthRows} />
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Transactions</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {transactions.data?.length ?? 0} in {intervalLabel(filters).toLowerCase()} · newest first
                </p>
              </div>
              <TransactionsTable rows={tableRows} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>
    </section>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">Couldn't load the dashboard.</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">Check that the API is running, then try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
      >
        Try again
      </button>
    </section>
  )
}
