import type {
  ApiRoutes,
  GetTransactionsSummaryRequestQuery,
  ListTransactionsRequestQuery,
} from '@duhnny/whatsapp-cashbook-api'

import { API_BASE_URL } from './env'

type MethodKey<Path extends keyof ApiRoutes> = keyof ApiRoutes[Path] & string

type RouteQuery<Path extends keyof ApiRoutes, Method extends MethodKey<Path>> =
  ApiRoutes[Path][Method] extends { query: infer Q } ? Q : never

type RouteBody<Path extends keyof ApiRoutes, Method extends MethodKey<Path>> =
  ApiRoutes[Path][Method] extends { body: infer B } ? B : never

type RouteResponse<Path extends keyof ApiRoutes, Method extends MethodKey<Path>> =
  ApiRoutes[Path][Method] extends { response: infer R } ? R : never

export interface ApiResponse<Path extends keyof ApiRoutes, Method extends MethodKey<Path>> {
  status: number
  body: RouteResponse<Path, Method>
}

/**
 * Serializes a query object the way the backend's `qs` parser expects it:
 * arrays as repeated keys (`categories=a&categories=b`), nested objects as
 * bracket keys (`dates[kind]=between&dates[start]=…`).
 */
function encodeQuery(input: Record<string, unknown>): string {
  const parts: string[] = []

  const walk = (prefix: string, value: unknown) => {
    if (value === undefined || value === null) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => walk(prefix, item))
      return
    }
    if (value instanceof Date) {
      parts.push(`${prefix}=${encodeURIComponent(value.toISOString())}`)
      return
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => walk(`${prefix}[${key}]`, item))
      return
    }
    parts.push(`${prefix}=${encodeURIComponent(String(value))}`)
  }

  Object.entries(input).forEach(([key, value]) => walk(key, value))

  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

/**
 * Calls a backend route from @duhnny/whatsapp-cashbook-api.
 *
 * The backend answers with a result envelope: `{ _tag: "ok", value }` on success
 * and `{ _tag: "err", error }` with a matching HTTP status code on failure.
 * Auth is a Clerk session JWT sent as a Bearer token (the backend reads it from
 * the Authorization header for cross-origin requests).
 */
async function callApi<Path extends keyof ApiRoutes, Method extends MethodKey<Path>>(
  path: Path,
  options: {
    method: Method
    body?: RouteBody<Path, Method>
    query?: RouteQuery<Path, Method>
    token: string | null
  },
): Promise<ApiResponse<Path, Method>> {
  const query = options.query ? encodeQuery(options.query as Record<string, unknown>) : ''

  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const body = (await response.json().catch(() => null)) as RouteResponse<Path, Method>

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

export const getTransactionsSummary = (token: string | null, query: GetTransactionsSummaryRequestQuery) =>
  callApi('/transactions/summary', {
    method: 'GET',
    query,
    token,
  })

export const listTransactions = (token: string | null, query: ListTransactionsRequestQuery) =>
  callApi('/transactions', {
    method: 'GET',
    query,
    token,
  })
