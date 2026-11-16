# WhatsApp Cashbook — Frontend

Simple web front for the WhatsApp cashbook automation: users sign up with Clerk, verify
their WhatsApp number, and get to a dashboard (placeholder for now) where their spending
will be shown.

## Stack

- TypeScript + React + Vite
- React Router v7
- Clerk (`@clerk/react`) — `<SignIn />` / `<SignUp />` components
- Tailwind CSS v4
- `@duhnny/whatsapp-cashbook-api` — type contract shared with the Fastify backend

## Quickstart

```bash
cp .env.example .env
# fill in VITE_CLERK_PUBLISHABLE_KEY (Clerk dashboard -> API keys)
# and VITE_API_BASE_URL (where the backend runs, default http://localhost:3000)
npm install
npm run dev
```

## Flow

1. `/sign-up` or `/sign-in` — Clerk hosted components. After completing either, the user
   lands on `/onboarding` (redirects are configured in code via `fallbackRedirectUrl`,
   not in the Clerk dashboard, so the flow stays visible and versioned here).
2. `/onboarding` — the user types their phone number. The app calls
   `POST /auth/whatsapp-verification` with the Clerk session JWT as a Bearer token.
   On success the backend sends a WhatsApp message asking the user to reply **SIM**.
   The user presses "I replied — verify now" (or refreshes the page) to check again.
   When the backend answers `alreadyVerified: true`, the app redirects to `/dashboard`.
3. `/dashboard` — placeholder with filters and stat/chart skeletons until the
   transactions endpoints exist.

## How the frontend knows the number is verified

The source of truth is the backend's own database (`user.whatsappVerified` + the
`users_creation` event stage) — the backend never writes Clerk user metadata, so the
frontend reads `user.publicMetadata` for nothing. Instead it asks
`POST /auth/whatsapp-verification`, whose response carries `alreadyVerified: true` once
the user has replied SIM. The result is cached in `sessionStorage` (keys
`whatsapp-cashbook:onboarding:*`) so `/dashboard` can be gated without an extra call.

If you later want Clerk metadata as a second source of truth, the backend's SIM webhook
handler (`src/routes/webhook.ts` in the backend repo) can write
`user.publicMetadata.whatsappVerified = 'true'` via the Clerk server SDK; the frontend
could then also check `user.publicMetadata`.

## API contract

The backend answers with a result envelope, not bare JSON:

```jsonc
// 200
{ "_tag": "ok",   "value": { "alreadyVerified": false, "message": "Verification message sent" } }
// 4xx/5xx
{ "_tag": "err",  "error": { "_tag": "NumberIsNotOnWhatsapp", "message": "...", "phone": 5511999999999 } }
```

| HTTP status | `error._tag`             | Meaning                                              |
| ----------- | ------------------------ | ---------------------------------------------------- |
| 400         | `ValidationError`        | Body failed schema validation                        |
| 401         | `Unauthenticated`/`MalformedJWT` | Missing/invalid Clerk session token          |
| 404         | `NumberIsNotOnWhatsapp`  | Number is not registered on WhatsApp                 |
| 500         | `InternalServerError`    | Backend/WhatsApp provider failure                    |
| 503         | `ServerProcessingUserCreation` | Account still being created; retry in seconds  |

The request body is `{ "phone": <number> }` — digits only, country code included
(e.g. `5511999999999`). The backend coerces it to `bigint` with `z.coerce.bigint()`;
the contract type stays `{ phone: bigint }`.

## Notes

- **No polling.** Every `POST /auth/whatsapp-verification` for an unverified number
  creates a new session and re-sends the WhatsApp message, so checks are user-driven
  (button) or happen once on page load — never on a timer.
- **Auth.** API calls send `Authorization: Bearer <session JWT>` from `useAuth().getToken()`.
  If the backend answers 401, the app signs the user out.
- **Troubleshooting:** if the backend rejects tokens with `Invalid 'azp' claim`, the
  `azp` value of the session JWT must be listed in the backend's `ALLOWED_ORIGINS`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run lint` — oxlint
