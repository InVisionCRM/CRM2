"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return {
          title: "Account Linking Required",
          message: "An account with this email already exists. Please sign in with your existing method first, or contact support to link your accounts.",
          suggestion: "Try signing in with a different method or contact support."
        }
      case "OAuthCallback":
        return {
          title: "OAuth Error",
          message: "There was an error with the OAuth provider.",
          suggestion: "Please try signing in again."
        }
      default:
        return {
          title: "Authentication Error",
          message: "An unexpected error occurred during authentication.",
          suggestion: "Please try again or contact support if the problem persists."
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            {errorInfo.message}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorInfo.suggestion}
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Link
            href="/auth/signin"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Go Home
          </Link>
        </div>
        
        {error && (
          <div className="mt-4 rounded bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Error Code: {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
} 