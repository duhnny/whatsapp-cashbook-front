import { Navigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/react'

import { clearOnboarding } from '../lib/onboarding'
import { Loading } from '../components/Loading'

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const clerk = useClerk()

  if (!isLoaded) {
    return <Loading />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  const handleSignOut = async () => {
    clearOnboarding()
    await clerk.signOut()
  }

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

      <main className="mx-auto max-w-4xl space-y-8 p-6">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Hi, {user?.firstName ?? 'there'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Your cashbook overview will live here. Placeholder until the backend endpoints are ready.
          </p>
        </div>

        {/* Filters placeholder */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            disabled
            aria-label="Category filter"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <option>All categories</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Housing</option>
            <option>Other</option>
          </select>
          <select
            disabled
            aria-label="Period filter"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This year</option>
          </select>
          <span className="text-xs text-neutral-400">Filters will be wired to the API once available</span>
        </div>

        {/* Stat placeholders */}
        <div className="grid gap-4 sm:grid-cols-3">
          {['Total spent', 'Transactions', 'Top category'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {label}
              </p>
              <div className="mt-3 h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Spending over time</p>
          <div className="mt-4 h-48 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <p className="mt-4 text-center text-xs text-neutral-400">
            Charts will render real data once the transactions API is connected
          </p>
        </div>
      </main>
    </div>
  )
}
