import React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import ErrorBoundary from "@/components/ErrorBoundary"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"

import { OfflineIndicator } from "@/components/OfflineIndicator"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Purlin",
    template: "%s | Purlin"
  },
  description: "Mobile-first CRM for roofing contractors. Manage leads, schedule appointments, track projects, and grow your roofing business.",
  keywords: [
    "roofing CRM",
    "mobile CRM",
    "roofing contractors",
    "lead management",
    "project tracking",
    "construction CRM",
    "roofing business software"
  ],
  authors: [{ name: "Roofing Mobile CRM Team" }],
  creator: "Roofing Mobile CRM",
  publisher: "Roofing Mobile CRM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Purlin",
    description: "Mobile-first CRM for roofing contractors",
    siteName: "Purlin",
            images: [
          {
            url: "/icons/icon-512x512.png",
            width: 512,
            height: 512,
            alt: "Purlin Logo",
          },
        ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Purlin",
    description: "Mobile-first CRM for roofing contractors",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/icons/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/icons/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/icons/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/icons/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-touch-icon-180x180.png",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Purlin",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
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
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Purlin CRM" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Purlin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
      </head>
      <body className={`${inter.className} h-screen`}>
        <ErrorBoundary>
          <Providers>
            {children}

            <OfflineIndicator />
            <ServiceWorkerRegistration />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
