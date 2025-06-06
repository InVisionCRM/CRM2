import type React from "react"
import { NavigationBar } from "@/components/navigation-bar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationBar />

      <main className="flex-1">{children}</main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Calendar Manager. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
