"use client"
import { useState, useEffect } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { IconArrowLeft, IconBrandTabler, IconSettings, IconUserBolt, IconHomeHeart, IconMap, IconCloud, IconUsers, IconActivity, IconCurrencyDollar, IconLink, IconMenu2 } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DockThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"

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
      icon: <IconHomeHeart className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Map",
      href: "/map",
      icon: <IconMap className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Links",
      href: "/quick-links",
      icon: <IconLink className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ]

  return (
    <>
      {/* Mobile menu toggle button - only visible on mobile */}
      {isMobile && !open && (
        <button 
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border border-input"
          aria-label="Open menu"
        >
          <IconMenu2 className="h-5 w-5" />
        </button>
      )}
      
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden",
          "border-r border-neutral-200 dark:border-neutral-700",
          "shrink-0",
          // Hide by default on mobile, show when open
          isMobile && !open ? "hidden" : "block",
          // On mobile when open, position as overlay
          isMobile && open ? "fixed inset-y-0 left-0 z-50 w-3/4 bg-background" : ""
        )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="flex items-center justify-between">
                {open ? <Logo /> : <LogoIcon />}
                {/* Close button - only visible on mobile when open */}
                {isMobile && open && (
                  <button 
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-md hover:bg-accent"
                    aria-label="Close menu"
                  >
                    <IconArrowLeft className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink 
                    key={idx} 
                    link={link} 
                    className={pathname === link.href ? "bg-primary/10 rounded-md px-2" : "px-2"}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <SidebarLink
                link={{
                  label: "Theme",
                  href: "#",
                  icon: <DockThemeToggle />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Profile",
                  href: "/profile",
                  icon: (
                    <div className="h-5 w-5 shrink-0 rounded-full bg-primary/10 overflow-hidden">
                      <img
                        src="https://assets.aceternity.com/manu.png"
                        className="h-full w-full object-cover"
                        alt="Avatar"
                      />
                    </div>
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
      </div>
    </>
  )
}

export const Logo = () => {
  return (
    <a href="/" className="relative z-20 flex items-center space-x-2 py-3 text-sm font-normal text-black">
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        CRM 55
      </motion.span>
    </a>
  )
}

export const LogoIcon = () => {
  return (
    <a href="/" className="relative z-20 flex items-center space-x-2 py-3 text-sm font-normal text-black">
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  )
} 