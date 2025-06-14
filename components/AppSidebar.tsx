"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signIn, signOut } from "next-auth/react"
import { User, LogIn, LogOut, Plus, MoreHorizontal, FileSignature, Bot } from "lucide-react"
import { IconUserBolt, IconHomeHeart, IconMap, IconLink, IconCalendar, IconFolder, IconRoute } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { ConstructionChatDrawer } from "@/components/ConstructionChatDrawer"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavLinkProps {
  link: NavLink
  className?: string
}

export default function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname() || ''
  const { data: session, status } = useSession()
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)

  const navLinks = [
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
  ]

  const moreLinks = [
    {
      label: "Map",
      href: "/map",
      icon: <IconMap className="h-5 w-5" />,
    },
    {
      label: "Route Planner",
      href: "/route-planner",
      icon: <IconRoute className="h-5 w-5" />,
    },
    {
      label: "Calendar",
      href: "/dashboard/calendar",
      icon: <IconCalendar className="h-5 w-5" />,
    },
    {
      label: "Drive",
      href: "/drive",
      icon: <IconFolder className="h-5 w-5" />,
    },
    {
      label: "Submissions",
      href: "/submissions",
      icon: <FileSignature className="h-5 w-5" />,
    },
    {
      label: "Links",
      href: "/quick-links",
      icon: <IconLink className="h-5 w-5" />,
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

  const NavLink = ({ link, className = "" }: NavLinkProps) => (
    <a
      href={link.href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
        pathname === link.href ? "text-[#59ff00] bg-white/10" : "text-white hover:text-[#59ff00] hover:bg-white/5",
        className
      )}
    >
      {link.icon}
      <span className="text-xs font-medium">{link.label}</span>
    </a>
  )

  return (
    <>
      <div className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
        "w-[420px] rounded-full",
        "bg-black/80 backdrop-blur-xl",
        "border border-white/20 shadow-2xl",
        className
      )}>
        <div className="flex items-center justify-between h-16 px-6">
          {/* Navigation Links */}
          <div className="flex items-center justify-between w-full gap-8">
            {/* Home */}
            <NavLink link={navLinks[0]} />
            
            {/* Leads */}
            <NavLink link={navLinks[1]} />

            {/* Add Lead Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setIsCreateLeadOpen(true)}
                className="flex flex-col items-center justify-center gap-1 absolute bottom-2"
              >
                <div className="w-15 h-15 rounded-full bg-[#59ff00] hover:bg-[#59ff00]/90 transition-colors flex items-center justify-center">
                  <Plus className="h-10 w-10 text-black overflow-visible" />
                </div>
                <span className="text-sm font-medium text-white">Add Lead</span>
              </button>
            </div>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
                  moreLinks.some(link => pathname === link.href) ? "text-[#59ff00] bg-white/10" : "text-white hover:text-[#59ff00] hover:bg-white/5"
                )}>
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-xs font-medium">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-black/80 backdrop-blur-md border-white/20 text-white" 
                align="end"
                sideOffset={16}
              >
                {/* AI Chat - Special treatment as it opens a drawer */}
                <ConstructionChatDrawer>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-white/10"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Bot className="h-5 w-5" />
                    <span className="ml-2">AI Assistant</span>
                  </DropdownMenuItem>
                </ConstructionChatDrawer>
                
                <DropdownMenuSeparator className="bg-white/10" />
                
                {moreLinks.map((link, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    className="cursor-pointer hover:bg-white/10"
                    onClick={() => window.location.href = link.href}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar */}
            {renderAvatar()}
          </div>
        </div>
      </div>

      <CreateLeadForm 
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
      />
    </>
  )
} 