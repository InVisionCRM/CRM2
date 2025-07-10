"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Home,
  User,
  Map,
  Calendar,
  ClipboardList,
  Mail,
  MoreHorizontal,
  Plus,
  FileSignature,
  FileText,
  Users,
  Route,
  Link as LinkIcon,
  Settings,
  Moon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const mainNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: User },
  { href: "/map", label: "Map", icon: Map },
]

const moreNavLinks = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/submissions", label: "MySigner", icon: FileSignature },
  { href: "/drive", label: "Drive", icon: FileText },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/quick-links", label: "Quick Links", icon: LinkIcon },
  { href: "/route-planner", label: "Route Planner", icon: Route },
  { href: "/team", label: "Team", icon: Users },
  { href: "/contracts/general", label: "Contracts", icon: ClipboardList },
  { href: "/admin/users", label: "Settings", icon: Settings },
]

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 h-full transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  )
}

function MoreMenu() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDarkMode = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-xs font-medium">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto bg-background">
        <SheetHeader>
          <SheetTitle>More Options</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {moreNavLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <link.icon
                  className={cn(
                    "h-7 w-7",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="flex items-center gap-2 text-base">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>{isDarkMode ? "Dark" : "Light"} Mode</span>
            </Label>
            <Switch
              id="theme-toggle"
              checked={isDarkMode}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function AppSidebar() {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 h-16 transform-gpu border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid h-full max-w-lg grid-cols-5 items-center">
          <NavLink href={mainNavLinks[0].href} icon={mainNavLinks[0].icon} label={mainNavLinks[0].label} />
          <NavLink href={mainNavLinks[1].href} icon={mainNavLinks[1].icon} label={mainNavLinks[1].label} />
          <div className="flex justify-center">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg -translate-y-4"
              onClick={() => setIsCreateLeadOpen(true)}
            >
              <Plus className="h-8 w-8" />
            </Button>
          </div>
          <NavLink href={mainNavLinks[2].href} icon={mainNavLinks[2].icon} label={mainNavLinks[2].label} />
          <MoreMenu />
        </div>
      </div>
      <CreateLeadForm
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
      />
    </>
  )
} 