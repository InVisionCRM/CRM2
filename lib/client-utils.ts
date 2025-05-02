/**
 * Safely checks if code is running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Safe access to window object - returns null if on server
 */
export const getWindow = () => (isBrowser ? window : null)

/**
 * Safe access to document object - returns null if on server
 */
export const getDocument = () => (isBrowser ? document : null)

/**
 * Get window dimensions safely (for SSR)
 */
export const getWindowDimensions = () => {
  if (!isBrowser) {
    return {
      width: 1024, // Default fallback width
      height: 768, // Default fallback height
    }
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
} 