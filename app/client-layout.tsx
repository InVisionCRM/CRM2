"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { MessageProvider } from "@/contexts/message-context"
import { MessageWidget } from "@/components/messages/message-widget"
import FloatingDockIOS from "@/components/floating-dock-ios"
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
      <MessageProvider>
        <div className="flex flex-col h-full">
          {/* main content grows to fill, and scrolls if needed */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 pb-20">{children}</main>
        </div>

        {!isMapPage && <FloatingDockIOS />}
        <MessageWidget />
      </MessageProvider>
    </ThemeProvider>
  )
}
