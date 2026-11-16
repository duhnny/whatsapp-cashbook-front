import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '@clerk/react'

import { isVerified } from '../lib/onboarding'
import { Loading } from './Loading'

export function RedirectIfSignedIn() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <Loading />
  }

  if (isSignedIn) {
    return <Navigate to={isVerified() ? '/dashboard' : '/onboarding'} replace />
  }

  return <Outlet />
}
