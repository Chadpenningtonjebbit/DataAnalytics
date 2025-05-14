import { useState, useEffect, useMemo } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile sized
 * Uses a memoized state to avoid unnecessary re-renders
 */
export function useIsMobile() {
  // Memoize the initial state to avoid unnecessary re-renders during first mount
  const mediaQuery = useMemo(
    () => typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) : null,
    []
  )
  
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )
  
  useEffect(() => {
    if (!mediaQuery) return
    
    // Set initial state from media query
    setIsMobile(mediaQuery.matches)
    
    // Define a function to handle changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    // Add the event listener
    try {
      // Modern API (standard)
      mediaQuery.addEventListener('change', handleChange)
      
      // Return cleanup function
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    } catch (e) {
      // Fallback for older browsers
      try {
        // @ts-ignore - older API
        mediaQuery.addListener(handleChange)
        
        // Return cleanup function
        return () => {
          // @ts-ignore - older API
          mediaQuery.removeListener(handleChange)
        }
      } catch (err) {
        console.error("Failed to add media query listener", err)
      }
    }
  }, [mediaQuery])
  
  return isMobile
} 