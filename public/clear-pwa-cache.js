// Script to clear PWA cache and service worker data
// Run this in the browser console if you're having PWA input issues

async function clearPWACache() {
  console.log('Clearing PWA cache...')
  
  // Clear service worker cache
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName)
      console.log('Deleted cache:', cacheName)
    }
  }
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
      console.log('Unregistered service worker')
    }
  }
  
  // Clear localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  console.log('Cleared local and session storage')
  
  // Reload the page
  window.location.reload()
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
  // Add to window for manual execution
  window.clearPWACache = clearPWACache
  
  // Check if we should auto-clear (for debugging)
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('clear-pwa-cache') === 'true') {
    clearPWACache()
  }
} 