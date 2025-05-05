"use client"
import { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { IconArrowLeft, IconBrandTabler, IconSettings, IconUserBolt, IconHomeHeart, IconMap, IconCloud, IconUsers, IconActivity, IconCurrencyDollar, IconLink } from "@tabler/icons-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { DockThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"

export default function AppSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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
      label: "Weather",
      href: "/weather",
      icon: <IconCloud className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Team",
      href: "/team-performance",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Activity",
      href: "/recent-activity",
      icon: <IconActivity className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Financial",
      href: "/financial-health",
      icon: <IconCurrencyDollar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
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
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        "border-r border-neutral-200 dark:border-neutral-700",
        "shrink-0",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
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