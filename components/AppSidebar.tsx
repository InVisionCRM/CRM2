"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconUserBolt, IconHomeHeart, IconMap, IconLink, IconCalendar, IconFolder, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signIn, signOut } from "next-auth/react"
import { User, LogIn, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  initialCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function AppSidebar({ 
  className, 
  initialCollapsed = true,
  onCollapsedChange 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const pathname = usePathname() || ''
  const { data: session, status } = useSession()

  // Call onCollapsedChange when isCollapsed changes
  useEffect(() => {
    onCollapsedChange?.(isCollapsed)
  }, [isCollapsed, onCollapsedChange])

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const links = [
    {
      label: "Home",
      href: "/",
      icon: <IconHomeHeart className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Map",
      href: "/map",
      icon: <IconMap className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Calendar",
      href: "/dashboard/calendar",
      icon: <IconCalendar className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Drive",
      href: "/drive",
      icon: <IconFolder className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Links",
      href: "/quick-links",
      icon: <IconLink className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
  ]

  const renderAvatar = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-10 w-10 border border-white/20 hover:border-white/40 transition-colors bg-black/50 backdrop-blur-sm">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
            ) : (
              <AvatarFallback className="bg-black/50 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-black/80 backdrop-blur-md border-white/20 text-white" align="start">
        {status === "authenticated" ? (
          <>
            <DropdownMenuLabel>
              {session.user.name || session.user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-white/10"
              onClick={() => window.location.href = "/profile"}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-white/10"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-white/10"
            onClick={() => signIn()}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col bg-black/25 backdrop-blur-lg border-r border-white/20",
          isCollapsed ? "w-[80px]" : "w-[300px]",
          "transition-all duration-300",
          className
        )}
      >
        <div className="flex h-full w-full flex-col gap-4">
          <div className="flex h-[60px] items-center justify-between px-6">
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "max-content" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Logo />
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#59ff00] hover:bg-white/10"
              onClick={handleCollapse}
            >
              {isCollapsed ? <IconChevronRight size={28} /> : <IconChevronLeft size={28} />}
            </Button>
          </div>
          
          {/* Avatar in desktop sidebar */}
          <div className="px-4">
            {renderAvatar()}
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 px-4">
              <TooltipProvider delayDuration={0}>
                {links.map((link, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <a
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/10",
                          pathname === link.href ? "bg-white/10" : "transparent",
                          "text-[#59ff00]",
                          isCollapsed && "justify-center"
                        )}
                      >
                        {link.icon}
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {link.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </a>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {link.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/25 backdrop-blur-lg border-t border-white/20">
        <div className="flex justify-around items-center h-16 px-2">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
                pathname === link.href ? "text-[#59ff00] bg-white/10" : "text-white hover:text-[#59ff00] hover:bg-white/5"
              )}
            >
              {link.icon}
              <span className="text-xs font-medium">{link.label}</span>
            </a>
          ))}
          {/* Avatar in mobile navigation */}
          <div className="flex flex-col items-center justify-center gap-1 p-2">
            {renderAvatar()}
          </div>
        </div>
        {/* Add safe area padding for iOS devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  )
}

export const Logo = () => {
  return (
    <a href="/" className="relative z-20 flex items-center space-x-1 py-1 text-sm font-normal">
      <div className="h-16 w-16 flex items-center justify-center">
        <span className="text-5xl font-bold text-[#59ff00]"></span>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-[#59ff00]"
      >
        PURLIN-VISION
      </motion.span>
    </a>
  )
} 