'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { motion } from "framer-motion";

interface LayoutClientWrapperProps {
  children: ReactNode;
}

/**
 * Client-side layout wrapper component that handles client-specific functionality
 * @param {LayoutClientWrapperProps} props - Component props
 * @returns {React.ReactElement} Rendered component
 */
export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps): React.ReactElement {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith("/map"); // Change to check if path starts with /map
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed

  // Effect for determining if the view is mobile
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAndUpdateMobileState = () => {
      const currentWidth = window.innerWidth;
      setIsMobile(currentWidth < 768);
      // Auto-close sidebar when switching to mobile
      if (currentWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    const debouncedCheck = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(checkAndUpdateMobileState, 100); 
    };

    debouncedCheck();
    window.addEventListener('resize', debouncedCheck);

    return () => {
      window.removeEventListener('resize', debouncedCheck);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  // Effect to manage sidebar visibility on resize
  useEffect(() => {
    const handleResizeForSidebar = () => {
      if (window.innerWidth >= 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResizeForSidebar);
    return () => window.removeEventListener('resize', handleResizeForSidebar);
  }, [isSidebarOpen]);

  // Touch handling for mobile swipe
  useEffect(() => {
    if (!isMobile || isMapPage) return; // Don't add swipe handlers on map page
    
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 30; // Lower threshold for easier swiping
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchEndX = touchStartX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
      
      // Calculate current swipe distance
      const currentSwipe = touchEndX - touchStartX;
      
      // If significant right swipe detected and near the left edge of screen
      if (currentSwipe > 50 && touchStartX < 30 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };
    
    const handleTouchEnd = () => {
      const swipeDistance = touchEndX - touchStartX;
      
      // Right swipe to open - from left edge or general swipe
      if ((swipeDistance > swipeThreshold && touchStartX < 50) || 
          (swipeDistance > 100)) {
        setIsSidebarOpen(true);
      } 
      // Left swipe to close
      else if (swipeDistance < -swipeThreshold && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    // Add a toggle button for easier sidebar access (not on map page)
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '☰';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
    toggleButton.style.left = '10px';
    toggleButton.style.zIndex = '50';
    toggleButton.style.background = 'rgba(0,0,0,0.3)';
    toggleButton.style.color = '#59ff00';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.padding = '8px 12px';
    toggleButton.style.fontSize = '20px';
    toggleButton.onclick = () => setIsSidebarOpen(prev => !prev);
    document.body.appendChild(toggleButton);
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.removeChild(toggleButton);
    };
  }, [isMobile, isSidebarOpen, isMapPage]);

  return (
    <div className="flex h-screen">
      {/* Render AppSidebar for non-map pages based on screen size */}
      {!isMapPage && !isMobile && (
        <AppSidebar initialCollapsed={true} />
      )}
      
      {/* Mobile sidebar for non-map pages */}
      {!isMapPage && isMobile && (
        <>
          {/* Backdrop when sidebar is open */}
          <motion.div
            className="fixed inset-0 bg-black/20 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ pointerEvents: isSidebarOpen ? 'auto' : 'none' }}
          />
          
          {/* Mobile sidebar */}
          <motion.div
            className="fixed inset-y-0 left-0 z-40 shadow-lg"
            initial={{ x: "-100%" }}
            animate={{ x: isSidebarOpen ? 0 : "-100%" }}
            transition={{ 
              type: "tween", 
              ease: "easeOut",
              duration: 0.25
            }}
            style={{ 
              width: '80px'  // Match collapsed width from AppSidebar
            }}
          >
            <AppSidebar initialCollapsed={true} />
          </motion.div>
        </>
      )}
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full h-full">
        <main className="flex-1 w-full overflow-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
} 