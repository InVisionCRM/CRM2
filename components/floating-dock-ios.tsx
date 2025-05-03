import { FloatingDock } from "@/components/ui/floating-dock"
import { DockThemeToggle } from "@/components/theme-toggle"

export default function FloatingDockIOS() {
  const links = [
    {
      title: "Theme",
      icon: <DockThemeToggle />,
      href: "#",
    },
    {
      title: "Dashboard",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/dashboard-TyY1RB6f6GZ0Bf3Z5ph0fpIkFZGS0X.png"
          alt="Dashboard"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/",
    },
    {
      title: "Leads",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/leads.png"
          alt="Leads"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/leads",
    },
    {
      title: "Map",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/map-Rjxy3WnfTwo3lr1xWQEbKqdjneezwD.png"
          alt="Map"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/map",
    },
    {
      title: "Weather",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/weather.png"
          alt="Weather"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/weather",
    },
    {
      title: "Team",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/team-IQCuzmluY97QJCTfxpDHmcASx1exAW.png"
          alt="Team"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/team-performance",
    },
    {
      title: "Activity",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/activity.png"
          alt="Activity"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/recent-activity",
    },
    {
      title: "Financial",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/financial.png"
          alt="Financial"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/financial-health",
    },
    {
      title: "Links",
      icon: (
        <img
          src="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Footer-menu/links.png"
          alt="Links"
          style={{ width: "100%", height: "100%" }}
        />
      ),
      href: "/quick-links",
    },
  ]
  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      <FloatingDock
        items={links}
        mobileClassName="bg-white dark:bg-gray-800 shadow-lg rounded-full p-2"
        desktopClassName="bg-white dark:bg-gray-800 shadow-lg rounded-full p-2"
      />
    </div>
  )
}
