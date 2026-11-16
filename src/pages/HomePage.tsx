import { Link, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/react'

import { isVerified } from '../lib/onboarding'
import { Loading } from '../components/Loading'

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <Loading />
  }

  if (isSignedIn) {
    return <Navigate to={isVerified() ? '/dashboard' : '/onboarding'} replace />
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        WhatsApp Cashbook
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        Register your expenses straight from the chat. Sign up, verify your WhatsApp number, and
        start typing transactions — the automation categorizes and timestamps them for you.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/sign-up"
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Create account
        </Link>
        <Link
          to="/sign-in"
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
