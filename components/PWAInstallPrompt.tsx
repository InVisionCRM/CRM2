"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Download } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

interface PWAInstallPromptProps {
  showOnlyOnLogin?: boolean
}

export function PWAInstallPrompt({ showOnlyOnLogin = false }: PWAInstallPromptProps) {
  const { isInstalled, canInstall, installApp, dismissInstallPrompt } = usePWA()
      
  // Don't show if already installed or no prompt available
  if (isInstalled || !canInstall) {
    return null
  }

  // If showOnlyOnLogin is true, only show on login page
  if (showOnlyOnLogin && typeof window !== 'undefined') {
    const isLoginPage = window.location.pathname === '/login'
    if (!isLoginPage) {
      return null
    }
  }

  const handleInstallClick = async () => {
    await installApp()
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
  }

  // Check if we're on the login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'

  return (
    <div className={isLoginPage ? "relative" : "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:left-auto md:right-4 md:transform-none md:w-80"}>
      <Card className={`border-l-4 border-l-blue-500 shadow-lg ${isLoginPage ? "bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border/20" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Install Purlin CRM</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Install Purlin CRM for quick access and offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 