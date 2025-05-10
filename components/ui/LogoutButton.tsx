'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react' // Or use a Tabler icon like IconLogout
// Assuming you have a general Button component
import { cn } from '@/lib/utils'

export function LogoutButton({
  className,
  iconOnly = false,
}: {
  className?: string
  iconOnly?: boolean
}) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md",
        "text-red-500 hover:bg-red-500/10 hover:text-red-600",
        "dark:text-red-400 dark:hover:bg-red-400/10 dark:hover:text-red-500",
        "transition-colors duration-150 ease-in-out group",
        className
      )}
    >
      <LogOut className={cn("h-5 w-5 shrink-0", !iconOnly && "mr-3")} aria-hidden="true" />
      {!iconOnly && <span className="flex-1">Log Out</span>}
      {iconOnly && <span className="sr-only">Log Out</span>}
    </button>
  )
} 