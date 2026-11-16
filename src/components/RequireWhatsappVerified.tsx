import { Navigate, Outlet } from 'react-router-dom'

import { isVerified } from '../lib/onboarding'

/**
 * Gates /dashboard on the onboarding flag set after the backend reports
 * `alreadyVerified: true`. The source of truth for verification is the
 * backend's own database (it never writes Clerk metadata), so this flag is
 * the frontend's cached copy of that answer.
 */
export function RequireWhatsappVerified() {
  if (!isVerified()) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
