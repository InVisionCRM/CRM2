"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      console.log('ServiceWorkerRegistration: Starting registration...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered successfully:', registration)

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          console.log('New service worker installing...')
          
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed:', newWorker.state)
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, update available')
              // You can show an update notification here
            } else if (newWorker.state === 'installed') {
              console.log('Service worker installed for the first time')
            }
          })
        }
      })

      // Handle service worker activation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated')
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  return null
} 