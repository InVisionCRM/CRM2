"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { MessageWidget } from "@/components/messages/message-widget"
import FloatingDockIOS from "@/components/floating-dock-ios"

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMapPage = pathname === "/map"

  return (
    <>
      <div className="flex flex-col h-full">
        {/* main content grows to fill, and scrolls if needed */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 pb-20">{children}</main>
      </div>

      {!isMapPage && <FloatingDockIOS />}
      <MessageWidget />
    </>
  )
}
