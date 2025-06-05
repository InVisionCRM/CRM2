"use client"

import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"

export function DashboardHeader() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === UserRole.ADMIN

  // Return null since we don't need this component anymore
  return null
}
