"use client"

import type React from "react"
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
    <div
      className="flex h-full w-full"
      style={
        isMapPage
          ? undefined
          : {
              backgroundImage:
                "radial-gradient(900px 500px at 100% -10%, rgba(164,214,94,0.05), transparent 60%), radial-gradient(700px 400px at -10% 110%, rgba(90,210,244,0.04), transparent 55%), linear-gradient(160deg, #0F1311, #131815)",
            }
      }
    >
      {/* Sidebar only shown on non-map pages */}
      {!isMapPage && <AppSidebar />}

      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full h-full">
        <main className={`flex-1 w-full overflow-auto bg-transparent ${!isMapPage ? 'pb-24' : ''}`}>{children}</main>
      </div>
    </div>
  )
}
