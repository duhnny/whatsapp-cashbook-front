import { SignIn } from '@clerk/react'

export default function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/dashboard" />
    </main>
  )
}
