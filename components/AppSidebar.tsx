"use client"
import { useState, useEffect } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { IconSettings, IconUserBolt, IconHomeHeart, IconMap, IconLink, IconMenu2, IconCalendar, IconFolder } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DockThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"
import { LogoutButton } from "@/components/ui/LogoutButton"

export default function AppSidebar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Check if we're on mobile when component mounts and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px is standard md breakpoint in Tailwind
    }
    
    // Check on initial render
    checkMobile()
    
    // Add resize listener
    window.addEventListener("resize", checkMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])
  
  // Close sidebar when navigation occurs on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false)
    }
  }, [pathname, isMobile])

  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconHomeHeart className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: <IconCalendar className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Drive",
      href: "/drive",
      icon: <IconFolder className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Map",
      href: "/map",
      icon: <IconMap className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Links",
      href: "/quick-links",
      icon: <IconLink className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-[#59ff00]" />,
    },
  ]

  return (
    <>
      {/* Mobile menu toggle button - only visible on mobile */}
      {isMobile && !open && (
        <button 
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-black/25 backdrop-blur-lg border border-white/20"
          aria-label="Open menu"
        >
          <IconMenu2 className="h-5 w-5 text-[#59ff00]" />
        </button>
      )}
      
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden",
          "shrink-0",
          "bg-black/25 backdrop-blur-lg",
          isMobile && !open ? "hidden" : "block",
          isMobile && open ? "fixed inset-y-0 left-0 z-50 w-3/4" : ""
        )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="flex items-center justify-between pr-2">
                {open ? <Logo /> : <LogoIcon />}
              </div>
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink 
                    key={idx} 
                    link={link} 
                    className={cn(
                      pathname === link.href ? "bg-white/10 dark:bg-white/5 rounded-md" : "",
                      "px-2 text-[#59ff00]"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Logout Button and Theme Toggle at the bottom */} 
            <div className="mt-auto flex flex-col gap-2 p-4">
              <LogoutButton className="px-2" />
              <DockThemeToggle />
            </div>
          </SidebarBody>
        </Sidebar>
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

export const LogoIcon = () => {
  return (
    <a href="/" className="relative z-20 flex items-center space-x-1 py-1 text-sm font-normal">
      <div className="h-16 w-16 flex items-center justify-center">
        <span className="text-5xl font-bold text-[#59ff00]"></span>
      </div>
    </a>
  )
} 