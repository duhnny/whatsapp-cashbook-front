import type { ApiRoutes } from '@duhnny/whatsapp-cashbook-api'

import { API_BASE_URL } from './env'

export interface ApiResponse<Path extends keyof ApiRoutes> {
  status: number
  body: ApiRoutes[Path]['response']
}

/**
 * Calls a backend route from @duhnny/whatsapp-cashbook-api.
 *
 * The backend answers with a result envelope: `{ _tag: "ok", value }` on success
 * and `{ _tag: "err", error }` with a matching HTTP status code on failure.
 * Auth is a Clerk session JWT sent as a Bearer token (the backend reads it from
 * the Authorization header for cross-origin requests).
 */
async function callApi<Path extends keyof ApiRoutes>(
  path: Path,
  options: {
    method: ApiRoutes[Path]['method']
    body?: unknown
    token: string | null
  },
): Promise<ApiResponse<Path>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const body = (await response.json().catch(() => null)) as ApiRoutes[Path]['response']

  return { status: response.status, body }
}

/**
 * POST /auth/whatsapp-verification
 *
 * Sends (or re-sends) the WhatsApp confirmation message. When the user has
 * already replied "SIM", the backend answers `alreadyVerified: true` instead of
 * sending anything, which doubles as our verification status check.
 *
 * The wire body is a JSON number; the backend coerces it with
 * `z.coerce.bigint()` (see src/schemas/auth.ts in the backend repo).
 */
export const requestWhatsappVerification = (token: string | null, phoneDigits: string) =>
  callApi('/auth/whatsapp-verification', {
    method: 'POST',
    body: { phone: Number(phoneDigits) },
    token,
  })
