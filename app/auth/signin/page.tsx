"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="h-5 w-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
} 