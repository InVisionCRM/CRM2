'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Smartphone, Monitor, Check, X, Star, Zap, Shield, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    // Check if already installed or in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const installed = (window.navigator as any).standalone || 
                     document.referrer.includes('android-app://') ||
                     standalone

    setIsStandalone(standalone)
    setIsInstalled(installed)

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-section-dismissed')
    setIsDismissed(!!dismissed)

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newRipple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    if (isIOS) {
      // Show iOS instructions
      alert('To install this app on iOS:\n1. Tap the Share button (⎋) in Safari\n2. Select "Add to Home Screen"\n3. Confirm by tapping "Add"')
      return
    }

    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      alert('To install this app:\n1. Open browser menu\n2. Look for "Install App" or "Add to Home Screen"\n3. Follow the prompts')
      return
    }

    setIsInstalling(true)

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-install-accepted', 'true')
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error installing PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-section-dismissed', 'true')
  }

  // Don't show if already installed, in standalone mode, or dismissed
  if (isInstalled || isStandalone || isDismissed) {
    return null
  }

  const features = [
    { icon: Zap, text: 'Lightning Fast', desc: 'Instant loading' },
    { icon: Globe, text: 'Works Offline', desc: 'No internet needed' },
    { icon: Shield, text: 'Secure & Private', desc: 'Your data stays safe' },
    { icon: Star, text: 'Native Experience', desc: 'App-like feel' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        </div>

        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Left Side - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Download className="w-3 h-3 mr-1" />
                  Available Now
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Free Install
                </Badge>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
                The #1 Roofing CRM Just Got Better!
              </h2>
              
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Get the full native app experience with offline access, faster loading, and seamless updates.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{feature.text}</div>
                      <div className="text-xs text-muted-foreground">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Platform-specific messaging */}
              <div className="text-xs text-muted-foreground mb-4">
                {isIOS && (
                  <span className="flex items-center justify-center lg:justify-start gap-1">
                    <Smartphone className="w-3 h-3" />
                    
                  </span>
                )}
                {isAndroid && (
                  <span className="flex items-center justify-center lg:justify-start gap-1">
                 
                    Android: Install directly from Chrome
                  </span>
                )}
                {!isIOS && !isAndroid && (
                  <span className="flex items-center justify-center lg:justify-start gap-1">
                    <Monitor className="w-3 h-3" />
                    Desktop: Install 
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-primary/60 rounded-full"
                      animate={{
                        x: [0, 30, -20, 25, 0],
                        y: [0, -25, 15, -30, 0],
                        opacity: [0, 1, 0.7, 1, 0],
                        scale: [0, 1, 0.8, 1.2, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut"
                      }}
                      style={{
                        left: `${20 + i * 10}%`,
                        top: `${15 + i * 8}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Main Button Container with Glow */}
                <motion.div
                  className="relative"
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop'
                  }}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                >
                  {/* Outer Glow Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={isHovered ? {
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                        '0 0 0 8px rgba(59, 130, 246, 0.1)',
                        '0 0 0 16px rgba(59, 130, 246, 0.05)',
                        '0 0 0 8px rgba(59, 130, 246, 0.1)',
                        '0 0 0 0 rgba(59, 130, 246, 0)'
                      ]
                    } : {
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                        '0 0 0 12px rgba(59, 130, 246, 0.1)',
                        '0 0 0 0 rgba(59, 130, 246, 0)'
                      ]
                    }}
                    transition={{ 
                      duration: isHovered ? 1.5 : 2.5,
                      repeat: Infinity,
                      repeatType: 'loop'
                    }}
                  />

                  {/* Background Gradient Animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-75"
                    animate={{
                      background: [
                        'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                        'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)',
                        'linear-gradient(135deg, #60a5fa, #3b82f6)',
                        'linear-gradient(180deg, #3b82f6, #1d4ed8)',
                        'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      background: [
                        'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        'linear-gradient(225deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        'linear-gradient(315deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  {/* The Actual Button */}
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      rotateX: 5,
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      rotateY: 0,
                      rotateX: 0,
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative"
                  >
                    <Button
                      onClick={handleInstallClick}
                      disabled={isInstalling}
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold py-6 px-8 rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300"
                      style={{
                        background: isHovered 
                          ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #60a5fa 100%)'
                          : 'linear-gradient(45deg, #3b82f6 0%, #1d4ed8 100%)',
                        boxShadow: isHovered
                          ? '0 20px 40px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : '0 10px 25px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                      }}
                    >
                      {/* Button Ripples */}
                      {ripples.map((ripple) => (
                        <motion.div
                          key={ripple.id}
                          className="absolute bg-white/30 rounded-full pointer-events-none"
                          style={{
                            left: ripple.x - 25,
                            top: ripple.y - 25,
                            width: 50,
                            height: 50,
                          }}
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 4, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      ))}

                      {/* Button Content */}
                      <div className="relative flex items-center z-10">
                        {isInstalling ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Download className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            animate={isHovered ? { 
                              y: [0, -2, 0],
                              rotate: [0, 5, -5, 0] 
                            } : {}}
                            transition={{ 
                              duration: 0.5,
                              repeat: isHovered ? Infinity : 0,
                              repeatType: 'loop'
                            }}
                            className="mr-2"
                          >
                            <Download className="w-5 h-5" />
                          </motion.div>
                        )}
                        <motion.span
                          animate={isHovered ? { 
                            scale: [1, 1.05, 1],
                          } : {}}
                          transition={{ 
                            duration: 0.3,
                            repeat: isHovered ? Infinity : 0,
                            repeatType: 'reverse'
                          }}
                        >
                          {isInstalling ? 'Installing...' : 'Install App'}
                        </motion.span>
                      </div>

                      {/* Inner Shine Effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          background: [
                            'linear-gradient(45deg, transparent, rgba(255,255,255,0.1) 50%, transparent)',
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)',
                            'linear-gradient(135deg, transparent, rgba(21, 177, 42, 0.45) 50%, transparent)',
                          ]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Maybe later
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Close button */}
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 p-1 h-auto w-auto opacity-50 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </Card>
    </motion.div>
  )
} 