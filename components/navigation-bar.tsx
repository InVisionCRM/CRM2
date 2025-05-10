"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Calendar, List, Plus, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function NavigationBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <User className="h-5 w-5" />,
    },
    {
      name: "Calendar",
      href: "/dashboard/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Events",
      href: "/dashboard/events",
      icon: <List className="h-5 w-5" />,
    },
    {
      name: "New Event",
      href: "/dashboard/events/new",
      icon: <Plus className="h-5 w-5" />,
    },
  ]

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <Calendar className="h-6 w-6 text-primary" />
              </motion.div>
              <span className="text-xl font-bold">Calendar Manager</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm",
                )}
              >
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {item.icon}
                </motion.div>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="hidden md:block text-sm">
                  <span className="text-gray-500">Signed in as </span>
                  <span className="font-medium">{session.user?.email}</span>
                </div>
                <Link href="/api/auth/signout">
                  <Button variant="outline" size="sm" className="transition-all duration-200 hover:shadow-md">
                    Sign Out
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/">
                <Button size="sm" className="transition-all duration-200 hover:shadow-md">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <motion.button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden py-2 border-t"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="flex flex-col space-y-1 pb-3">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md",
                        isActive(item.href)
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
