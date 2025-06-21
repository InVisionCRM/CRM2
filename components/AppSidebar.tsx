"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signIn, signOut } from "next-auth/react"
import { User, LogIn, LogOut, Plus, MoreHorizontal, FileSignature, Bot, Mail } from "lucide-react"
import Image from 'next/image'
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
  onClick?: () => void
}

interface NavLinkProps {
  link: NavLink
  className?: string
}

export default function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname() || ''
  const { data: session, status } = useSession()
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const prevScroll = useRef(0)

  // Hide sidebar when scrolling down on mobile (<768px), show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) return // desktop – always visible
      const current = window.scrollY
      if (current > prevScroll.current && current > 60) {
        // scrolling down
        setIsHidden(true)
      } else {
        // scrolling up
        setIsHidden(false)
      }
      prevScroll.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: "Home", href: "/", icon: <IconHomeHeart className="h-5 w-5" /> },
    { label: "Leads", href: "/leads", icon: <IconUserBolt className="h-5 w-5 text-[#FF5400]" /> },
    { label: "Map", href: "/map", icon: <IconMap className="h-5 w-5 text-[#52489C]" /> },
    { label: "Add Lead", href: "#add-lead", icon: <Plus className="h-6 w-6 text-lime-400" />, onClick: () => setIsCreateLeadOpen(true) },
    { label: "MySigner", href: "/submissions", icon: <FileSignature className="h-5 w-5 text-[#F2E8CF]" /> },
  ] as const;

  const googleLinks = [
    { label: "Calendar", href: "/dashboard/calendar", icon: <IconCalendar className="h-5 w-5 text-[#FFBD00]" /> },
    { label: "Drive", href: "/drive", icon: <IconFolder className="h-5 w-5 text-[#ea4335]" /> },
    { label: "Gmail", href: "/gmail", icon: <Mail className="h-5 w-5 text-[#68B0AB]" /> },
  ] as const;

  const moreLinks = [
    { label: "Quick Links", href: "/quick-links", icon: <IconLink className="h-5 w-5 text-[#337CA0] hover:text-[#FFC800]" /> },
    { label: "Route Planner", href: "/route-planner", icon: <IconRoute className="h-5 w-5 text-[#16E0BD] hover:text-[#FFC800]" /> },
    { label: "Team", href: "/team", icon: <User className="h-5 w-5 text-[#77CBB9] hover:text-[#FFC800]" /> },
    { label: "Contracts", href: "/contracts/general", icon: <FileSignature className="h-5 w-5 text-[#E13700] hover:bg-white/10 hover:text-[#FFC800]" /> },
  ] as const;

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

  const NavLink = ({ link, className = "" }: NavLinkProps) => {
    const handleClick = (e: React.MouseEvent) => {
      if (link.onClick) {
        e.preventDefault();
        link.onClick();
      }
    };
    return (
      <a
        href={link.href}
        onClick={handleClick}
        className={cn(
          "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
          pathname === link.href ? "text-[#59ff00] bg-white/10" : "text-white hover:text-[#59ff00] hover:bg-white/5",
          className
        )}
      >
        {link.icon}
        <span className="text-xs font-medium text-center leading-tight">{link.label}</span>
      </a>
    );
  };

  const GoogleMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
          googleLinks.some(link => pathname === link.href) ? "text-[#ea4335] bg-white/10" : "text-white hover:text-[#ea4335] hover:bg-white/5",
        )}>
          <Image 
            src="/icons/google-color.svg" 
            alt="Google" 
            width={20} 
            height={20} 
          />
          <span className="text-xs font-medium text-center leading-tight">Google</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-black/80 backdrop-blur-md border-white/20 text-white" align="center">
        {googleLinks.map((link) => (
          <DropdownMenuItem 
            key={link.href}
            className="cursor-pointer hover:bg-white/10 flex items-center gap-2"
            onClick={() => window.location.href = link.href}
          >
            {link.icon}
            {link.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MoreMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
          moreLinks.some(link => pathname === link.href) ? "text-[#59ff00] bg-white/10" : "text-white hover:text-[#FFC800] hover:bg-white/5",
        )}>
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-xs font-medium text-center leading-tight">More</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-black/80 backdrop-blur-md border-white/20 text-white" align="center">
        {moreLinks.map((link) => (
          <DropdownMenuItem 
            key={link.href}
            className="cursor-pointer hover:bg-white/10 flex items-center gap-2"
            onClick={() => window.location.href = link.href}
          >
            {link.icon}
            {link.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-black/75 backdrop-blur",
        "border-t border-white/20 shadow-2xl",
        "transform transition-transform duration-300",
        isHidden ? "translate-y-full" : "translate-y-0",
        className
      )}>
        <div className="flex items-center justify-evenly h-20 px-2 pb-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
          <GoogleMenu />
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