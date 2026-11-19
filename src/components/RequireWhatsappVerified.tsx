import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, useClerk } from '@clerk/react'

import { Loading } from '../components/Loading'
import { getUserWhatsappVerification } from '../lib/api'
import { clearOnboarding, isVerified, setVerified } from '../lib/onboarding'

/**
 * Gates /dashboard on a live database check instead of a cached flag.
 *
 * The source of truth for verification is the backend's own DB (it never writes
 * Clerk metadata), so the gate asks it directly on every mount. The cached
 * sessionStorage flag is only a fast path — it is cleared the moment the live
 * check disagrees, so a stale "verified" can never let an unverified user in.
 */
export function RequireWhatsappVerified() {
  const { getToken } = useAuth()
  const clerk = useClerk()
  const [status, setStatus] = useState<'checking' | 'verified' | 'unverified'>(
    isVerified() ? 'verified' : 'checking',
  )

  useEffect(() => {
    let cancelled = false

    void Promise.resolve().then(async () => {
      const token = await getToken()
      if (cancelled) return

      const { body } = await getUserWhatsappVerification(token)
      if (cancelled) return

      if (body._tag === 'ok' && body.value.whatsappVerified) {
        setVerified()
        setStatus('verified')
        return
      }

      if (
        body._tag === 'err' &&
        (body.error._tag === 'Unauthenticated' || body.error._tag === 'MalformedJWT')
      ) {
        await clerk.signOut()
        setStatus('unverified')
        return
      }

      clearOnboarding()
      setStatus('unverified')
    })

    return () => {
      cancelled = true
    }
  }, [getToken, clerk])

  if (status === 'checking') {
    return <Loading />
  }

  if (status === 'verified') {
    return <Outlet />
  }

  return <Navigate to="/onboarding" replace />
}