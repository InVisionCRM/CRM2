export default function SignedOutPage() {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl text-white font-bold">You’ve been signed out.</h1>
          <p className="text-white/60 mt-2">See you next time!</p>
          <a
            href="/auth/signin"
            className="inline-block mt-4 px-4 py-2 bg-[#59ff00] text-black font-semibold rounded hover:bg-[#59ff00]/90"
          >
            Sign in again
          </a>
        </div>
      </div>
    )
  }
  