import React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import LayoutClientWrapper from "@/components/LayoutClientWrapper"
import { AuthProvider } from "./auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Roofing Mobile CRM",
  description: "Mobile-first CRM for roofing contractors",
  generator: 'v0.dev',
  icons: {
    icon: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Purlin_Logo-QGECcCeMQoHVp3aZWHJv36rKSvRq2z.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-screen`}>
        <AuthProvider>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
