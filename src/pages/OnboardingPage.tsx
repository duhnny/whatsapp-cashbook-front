import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, useClerk, useUser } from '@clerk/react'

import {
  getUserWhatsappVerification,
  requestWhatsappVerification,
} from '../lib/api'
import { Loading } from '../components/Loading'
import {
  clearStoredPhone,
  isVerified,
  setVerified,
  storePhone,
} from '../lib/onboarding'
import { isValidPhone, sanitizePhoneInput } from '../lib/phone'

type Stage = 'form' | 'busy' | 'waiting'

const ERROR_TEXT: Record<string, string> = {
  NumberIsNotOnWhatsapp: 'That number is not registered on WhatsApp. Check the digits and try again.',
  ServerProcessingUserCreation: 'Your account is still being set up. Wait a few seconds and try again.',
  ValidationError: 'That phone number is not valid.',
  Unauthenticated: 'Your session expired. Sign in again.',
  MalformedJWT: 'Your session is invalid. Sign in again.',
  InternalServerError: 'Something went wrong on our side. Please try again in a moment.',
}

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const clerk = useClerk()
  const navigate = useNavigate()

  const [digits, setDigits] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [busyLabel, setBusyLabel] = useState('')
  const [errorText, setErrorText] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const autoChecked = useRef(false)

  const finish = useCallback(() => {
    setVerified()
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const checkPhone = useCallback(
    async (phone: string, busyText: string) => {
      setStage('busy')
      setBusyLabel(busyText)
      setErrorText('')

      try {
        const token = await getToken()
        const { body } = await requestWhatsappVerification(token, phone)

        if (body && body._tag === 'ok') {
          storePhone(phone)

          if (body.value.alreadyVerified) {
            finish()
            return
          }

          setPendingPhone(phone)
          setStage('waiting')
          return
        }

        const tag = body && body._tag === 'err' ? body.error._tag : 'InternalServerError'

        if (tag === 'Unauthenticated' || tag === 'MalformedJWT') {
          await clerk.signOut()
          return
        }

        setErrorText(ERROR_TEXT[tag] ?? 'Unexpected error. Please try again.')
        setStage('form')
      } catch {
        setErrorText('Could not reach the server. Is the backend running?')
        setStage('form')
      }
    },
    [clerk, finish, getToken],
  )

  const checkVerified = useCallback(async () => {
    try {
      const token = await getToken()
      const { body } = await getUserWhatsappVerification(token)

      if (body._tag === 'ok' && body.value.whatsappVerified) {
        finish()
        return
      }

      if (
        body._tag === 'err' &&
        (body.error._tag === 'Unauthenticated' || body.error._tag === 'MalformedJWT')
      ) {
        await clerk.signOut()
      }
    } catch {
      // Offline or server down: stay on the form, the user can still submit.
    }
  }, [clerk, finish, getToken])

  useEffect(() => {
    if (autoChecked.current) {
      return
    }
    autoChecked.current = true

    // A single status check on load is what makes "refresh the page and you are
    // done" work. It is a GET, so it never sends a WhatsApp message — no polling
    // needed, and no risk of spamming the user's phone.
    if (!isVerified()) {
      void Promise.resolve().then(() => checkVerified())
    }
  }, [checkVerified])

  if (!isLoaded) {
    return <Loading />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  if (isVerified()) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidPhone(digits)) {
      return
    }
    void checkPhone(digits, 'Sending verification…')
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-950">
      <section className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Verify your WhatsApp number
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            We send a message to your WhatsApp — reply <strong>SIM</strong> to confirm it&apos;s yours.
          </p>
        </header>

        {stage === 'form' && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={digits}
                onChange={(event) => setDigits(sanitizePhoneInput(event.target.value))}
                placeholder="5511999999999"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-200"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Digits only, including the country code (e.g. 5511999999999).
              </p>
            </div>

            {errorText !== '' && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {errorText}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValidPhone(digits)}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Send verification code
            </button>
          </form>
        )}

        {stage === 'busy' && (
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-white" />
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{busyLabel}</p>
          </div>
        )}

        {stage === 'waiting' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              <p>
                We sent a message to{' '}
                <strong className="text-neutral-900 dark:text-white">+{pendingPhone}</strong>.
              </p>
              <p className="mt-1">
                Open WhatsApp and reply <strong>SIM</strong>, then press the button below.
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Pressing the button again re-sends the WhatsApp message if you have not replied yet.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void checkVerified()}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              I replied — verify now
            </button>
            <button
              type="button"
              onClick={() => {
                clearStoredPhone()
                setPendingPhone('')
                setDigits('')
                setErrorText('')
                setStage('form')
              }}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Use a different number
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
