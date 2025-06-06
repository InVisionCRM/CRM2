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
    icon: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/in-vision-logo-UJNZxvzrwPs8WsZrFbI7Z86L8TWcc5.png",
    apple: "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/in-vision-logo-UJNZxvzrwPs8WsZrFbI7Z86L8TWcc5.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roofing Mobile CRM",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roofing Mobile CRM" />
        <link 
          rel="apple-touch-icon" 
          href="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/in-vision-logo-UJNZxvzrwPs8WsZrFbI7Z86L8TWcc5.png" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/in-vision-logo-UJNZxvzrwPs8WsZrFbI7Z86L8TWcc5.png" 
        />
      </head>
      <body className={`${inter.className} h-screen`}>
        <AuthProvider>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
