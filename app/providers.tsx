"use client"

import type React from "react"
import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import ClientLayout from "./client-layout"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ClientLayout>{children}</ClientLayout>
      </ThemeProvider>
    </SessionProvider>
  )
}
