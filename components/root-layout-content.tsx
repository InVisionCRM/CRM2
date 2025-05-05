"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import AppSidebar from "@/components/AppSidebar"

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMapPage = pathname === "/map"

  return (
    <>
      <div className="flex h-full w-full">
        {/* Sidebar only shown on non-map pages */}
        {!isMapPage && <AppSidebar />}
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full h-full">
          <main className="flex-1 w-full overflow-auto bg-gray-50 dark:bg-gray-900">{children}</main>
        </div>
      </div>

      <MessageWidget />
    </>
  )
}
