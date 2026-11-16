import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '@clerk/react'

import { Loading } from './Loading'

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <Loading />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
