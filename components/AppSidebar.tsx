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
        "flex flex-col items-center justify-center gap-1 h-full transition-colors",
        isActive
          ? "text-primary"
          : "text-white/80 hover:text-foreground"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
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
            "flex flex-col items-center justify-center gap-1 h-full transition-colors text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="h-6 w-6 text-white" />
          <span className="text-sm font-medium text-white/80">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto bg-transparent">
        <SheetHeader>
          <SheetTitle>More Options</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
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
                  "flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors",
                  isActive
                    ? "bg-accent text-white/80"
                    : "hover:bg-accent/50"
                )}
              >
                <link.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="theme"
            checked={isDarkMode}
            onCheckedChange={toggleTheme}
          />
          <Label htmlFor="theme">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 h-20 transform-gpu border-t/2 bg-opacity-70 border-t-primary/20 border-2 backdrop-blur-md bg-black/40 supports-[backdrop-filter]:bg-black/40 bg-transparent border-t-primary pb-[calc(env(safe-area-inset-bottom)+20px)] before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/10 before:to-transparent before:pointer-events-none">
        <div className="mx-auto grid h-full max-w-lg grid-cols-7 items-center relative">
          <NavLink href={mainNavLinks[0].href} icon={mainNavLinks[0].icon} label={mainNavLinks[0].label} />
          <NavLink href={mainNavLinks[1].href} icon={mainNavLinks[1].icon} label={mainNavLinks[1].label} />
          <NavLink href="/submissions" icon={FileSignature} label="Subs" />
          <div className="flex justify-center">
            <div className="relative">
              {/* Glowing background */}
              <div className="absolute inset-0 bg-primary bg-opacity-50 blur-sm rounded-full animate-glow scale-100 -translate-y-4 hover:bg-white/5 transition-all"></div>
              {/* Button */}
              <Button
                size="sm"
                className="relative h-16 w-16 rounded-full bg-opacity-5 border border-primary/50 border-2 transform-gpu backdrop-blur-lg shadow-lg shadow-black shadow-bottom-[10px] -translate-y-4 hover:bg-white/10 transition-all duration-300"
                onClick={() => setIsCreateLeadOpen(true)}
              >
                <span className="text-xs font-semibold text-white">Add Lead</span>
              </Button>
            </div>
          </div>
          <NavLink href={mainNavLinks[2].href} icon={mainNavLinks[2].icon} label={mainNavLinks[2].label} />
          <button
            className="flex flex-col items-center justify-center gap-1 h-full transition-colors text-white/80 hover:text-foreground relative"
            onClick={() => setIsBulletinBoardOpen(true)}
          >
            <Rss className="h-6 w-6" />
            <span className="text-sm font-medium">Chat</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center p-0 min-w-0">
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