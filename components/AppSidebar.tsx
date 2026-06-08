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
  MessageSquare,
  Rss,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { BulletinBoard } from "@/components/bulletin-board"
import { BulletinBoardFloatingTag } from "@/components/bulletin-board-floating-tag"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"

// Hook to get unread message count
function useUnreadMessageCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    const checkUnreadMessages = () => {
      try {
        const stored = localStorage.getItem('bulletin-board-messages')
        if (stored) {
          const messages = JSON.parse(stored)
          const unread = messages.filter((message: any) => {
            const readBy = message.readBy || []
            return !readBy.includes(session.user.id)
          }).length
          setUnreadCount(unread)
        }
      } catch (error) {
        console.error('Error checking unread messages:', error)
      }
    }

    // Check immediately
    checkUnreadMessages()

    // Check every 5 seconds for new messages
    const interval = setInterval(checkUnreadMessages, 5000)

    // Listen for storage changes (when bulletin board updates)
    const handleStorageChange = () => {
      checkUnreadMessages()
    }

    // Listen for custom bulletin board update events
    const handleBulletinBoardUpdate = () => {
      checkUnreadMessages()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('bulletin-board-updated', handleBulletinBoardUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bulletin-board-updated', handleBulletinBoardUpdate)
    }
  }, [session?.user?.id])

  return unreadCount
}

const mainNavLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: User },
  { href: "/map", label: "Map", icon: Map },
  { label: "Chat", icon: Rss, action: "bulletin-board" },
]

const moreNavLinks = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/drive", label: "Drive", icon: FileText },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/templates", label: "Templates", icon: MessageSquare },
  { href: "/quick-links", label: "Quick Links", icon: LinkIcon },
  { href: "/route-planner", label: "Route Planner", icon: Route },
  { href: "/team", label: "Team", icon: Users },
  { href: "/contracts/general", label: "Contracts", icon: ClipboardList },
  { href: "/admin/deletion-requests", label: "Deletion Requests", icon: Shield, adminOnly: true },
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
        "flex flex-col items-center justify-center gap-1 h-full transition-colors duration-150",
        isActive
          ? "text-[#A4D65E]"
          : "text-[#A7B0A6] hover:text-[#ECEAE0]"
      )}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
      <span className="text-[11px] font-medium tracking-tight">{label}</span>
    </Link>
  )
}

function MoreMenu() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

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
            "flex flex-col items-center justify-center gap-1 h-full transition-colors duration-150 text-[#A7B0A6] hover:text-[#ECEAE0]"
          )}
        >
          <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={2} />
          <span className="text-[11px] font-medium tracking-tight">More</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-auto border-t border-[rgba(236,234,224,0.08)] bg-[#161D18]/95 backdrop-blur-xl text-[#ECEAE0]"
      >
        <SheetHeader>
          <SheetTitle className="text-[#ECEAE0] tracking-tight">More Options</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3 py-5">
          {moreNavLinks.map((link) => {
            const isActive = pathname === link.href

            // Skip admin-only links for non-admin users
            if (link.adminOnly && session?.user?.role !== 'ADMIN') {
              return null
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition-colors duration-150 border",
                  isActive
                    ? "bg-[rgba(164,214,94,0.10)] border-[rgba(164,214,94,0.25)] text-[#ECEAE0]"
                    : "bg-[#1B231D] border-[rgba(236,234,224,0.08)] text-[#A7B0A6] hover:text-[#ECEAE0] hover:border-[rgba(236,234,224,0.14)]"
                )}
              >
                <link.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-[#A4D65E]" : ""
                  )}
                  strokeWidth={2}
                />
                <span className="text-[12px] font-medium tracking-tight">{link.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="flex items-center space-x-2 pt-2 border-t border-[rgba(236,234,224,0.08)]">
          <Switch
            id="theme"
            checked={isDarkMode}
            onCheckedChange={toggleTheme}
          />
          <Label htmlFor="theme" className="text-[#A7B0A6]">
            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Label>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function AppSidebar() {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)
  const [isBulletinBoardOpen, setIsBulletinBoardOpen] = useState(false)
  const unreadCount = useUnreadMessageCount()
  const { data: session, status } = useSession()

  // Don't render sidebar if not authenticated
  if (status === "loading") return null
  if (!session) return null

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 h-20 transform-gpu border-t border-[rgba(236,234,224,0.08)] bg-[#0F1311]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0F1311]/75 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)]"
      >
        <div className="mx-auto grid h-full max-w-lg grid-cols-7 items-center relative">
          <NavLink href={mainNavLinks[0].href} icon={mainNavLinks[0].icon} label={mainNavLinks[0].label} />
          <NavLink href={mainNavLinks[1].href} icon={mainNavLinks[1].icon} label={mainNavLinks[1].label} />
          <NavLink href="/submissions" icon={FileSignature} label="Subs" />
          <div className="flex justify-center">
            <div className="relative">
              {/* Soft lime halo */}
              <div className="absolute inset-0 -translate-y-4 rounded-full bg-[#A4D65E]/20 blur-md scale-110 pointer-events-none"></div>
              {/* Button */}
              <Button
                size="sm"
                className="relative h-16 w-16 rounded-full -translate-y-4 bg-gradient-to-b from-[#A4D65E] to-[#7FB23F] hover:from-[#B1DE6F] hover:to-[#88BD46] border-0 text-[#10160C] shadow-[0_8px_22px_-8px_rgba(164,214,94,0.55)] transition-all duration-150"
                onClick={() => setIsCreateLeadOpen(true)}
              >
                <span className="text-[11px] font-semibold tracking-tight">Add Lead</span>
              </Button>
            </div>
          </div>
          <NavLink href={mainNavLinks[2].href} icon={mainNavLinks[2].icon} label={mainNavLinks[2].label} />
          <button
            className="flex flex-col items-center justify-center gap-1 h-full transition-colors duration-150 text-[#A7B0A6] hover:text-[#ECEAE0] relative"
            onClick={() => setIsBulletinBoardOpen(true)}
          >
            <Rss className="h-[22px] w-[22px]" strokeWidth={2} />
            <span className="text-[11px] font-medium tracking-tight">Chat</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#EF5E73] text-[#ECEAE0] text-[10px] font-bold flex items-center justify-center p-0 min-w-0 border border-[#0F1311]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
          <MoreMenu />
        </div>
      </div>
      <CreateLeadForm
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
      />
      <BulletinBoard 
        isOpen={isBulletinBoardOpen} 
        onClose={() => setIsBulletinBoardOpen(false)} 
      />
      {/* <BulletinBoardFloatingTag 
        onOpen={() => setIsBulletinBoardOpen(true)}
        unreadCount={unreadCount}
      /> */}
    </>
  )
} 