"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import AppSidebar from "@/components/AppSidebar"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isMapPage = pathname === "/map"

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex h-full w-full">
        {/* Sidebar only shown on non-map pages */}
        {!isMapPage && <AppSidebar />}
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full h-full">
          <main className="flex-1 w-full overflow-auto bg-gray-50 dark:bg-gray-900">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
