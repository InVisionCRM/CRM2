"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MessageSquare, ChevronUp, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useMessage } from "@/contexts/message-context"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

export function Footer() {
  const { toggleMessagePanel, unreadCount } = useMessage()
  const [open, setOpen] = useState(false)

  const handleTabClick = () => {
    setOpen(true)
  }

  const navigationItems = [
    {
      href: "/",
      label: "Dashboard",
      imageSrc:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/dashboard-TyY1RB6f6GZ0Bf3Z5ph0fpIkFZGS0X.png",
    },
    {
      href: "/map",
      label: "Map",
      imageSrc:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/map-Rjxy3WnfTwo3lr1xWQEbKqdjneezwD.png",
    },
    {
      href: "/leads",
      label: "Leads",
      imageSrc: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/leads.png",
    },
    {
      href: "/financial-health",
      label: "Financial",
      imageSrc: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/financial.png",
    },
    {
      href: "/team-performance",
      label: "Team",
      imageSrc:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/team-IQCuzmluY97QJCTfxpDHmcASx1exAW.png",
    },
    {
      href: "/recent-activity",
      label: "Activity",
      imageSrc: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/activity.png",
    },
    {
      href: "/weather",
      label: "Weather",
      imageSrc: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/weather.png",
    },
    {
      href: "/quick-links",
      label: "Quick-Links",
      imageSrc: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/links.png",
    },
  ]

  return (
    <>
      <style jsx global>{`
        @keyframes breathing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-pulse {
          animation: breathing 2s infinite ease-in-out;
        }
      `}</style>
      {/* Tab at the bottom */}
      <button onClick={handleTabClick} className="fixed bottom-0 left-0 right-0 flex justify-center items-center z-50">
        <div className="bg-gradient-to-b from-lime-500/50 to-black/50 text-white px-8 py-2 rounded-t-xl flex items-center justify-center gap-2 shadow-lg w-[200%]">
          <div className="flex items-center animate-pulse">
            <ChevronUp className="h-5 w-5" />
            <ChevronUp className="h-5 w-5" />
            <ChevronUp className="h-5 w-5" />
          </div>
          <span className="font-medium">MENU</span>
          <div className="flex items-center animate-pulse">
            <ChevronUp className="h-5 w-5" />
            <ChevronUp className="h-5 w-5" />
            <ChevronUp className="h-5 w-5" />
          </div>
        </div>
      </button>

      {/* Drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-white dark:bg-gray-800 rounded-t-xl">
          <div className="mx-auto w-auto">
            <DrawerHeader>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                <DrawerTitle className="text-lg font-semibold">Menu</DrawerTitle>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    className="rounded-full relative w-12 h-12 p-0"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleMessagePanel()
                      setOpen(false)
                    }}
                  >
                    <MessageSquare className="h-7 w-7 text-green-600 dark:text-green-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Messages</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full relative w-12 h-12 p-0 border border-gray-200 dark:border-gray-700"
                    onClick={() => {
                      window.location.href = "/profile"
                      setOpen(false)
                    }}
                  >
                    <User className="h-7 w-7 text-green-600 dark:text-green-400" />
                    <span className="sr-only">Profile</span>
                  </Button>
                  <div className="scale-125">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </DrawerHeader>
            <div className="p-4">
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center justify-center w-130 h-130 aspect-square rounded-lg text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-primary hover:dark:text-primary transition-colors p-2"
                  >
                    <div className="relative w-130 h-130 aspect-square">
                      <Image
                        src={item.imageSrc || "/placeholder.svg"}
                        alt={item.label}
                        width={180}
                        height={180}
                        className="object-contain"
                        priority
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
