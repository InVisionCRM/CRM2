"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconSettings, IconUserBolt, IconHomeHeart, IconMap, IconLink, IconCalendar, IconFolder, IconChevronLeft, IconChevronRight, IconDeviceLaptop, IconScale, IconLogout } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { signOut } from "next-auth/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  initialCollapsed?: boolean
}

export default function AppSidebar({ className, initialCollapsed = true }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const pathname = usePathname()

  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconHomeHeart className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "GoogleCalendar",
      href: "/dashboard/calendar",
      icon: <IconCalendar className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "GoogleDrive",
      href: "/drive",
      icon: <IconFolder className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Metrics",
      href: "/team",
      icon: <IconScale className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Links",
      href: "/quick-links",
      icon: <IconLink className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-[#ffffff]" />,
    },
  ]

  const SidebarContent = () => (
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
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <IconChevronRight size={28} /> : <IconChevronLeft size={28} />}
        </Button>
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
      <div className={cn("flex flex-col gap-2 px-4 pb-4 z-200", isCollapsed && "items-center")}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("text-[#59ff00] hover:bg-white/10", isCollapsed ? "w-10 h-10" : "w-full h-10")}
                onClick={async () => {
                  await signOut({ callbackUrl: "/login", redirect: true });
                }}
              >
                <IconLogout className="h-5 w-5" />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-2"
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-black/25 backdrop-blur-lg border-r border-white/20",
        isCollapsed ? "w-[80px]" : "w-[300px]",
        "transition-all duration-300",
        className
      )}
    >
      <SidebarContent />
    </div>
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