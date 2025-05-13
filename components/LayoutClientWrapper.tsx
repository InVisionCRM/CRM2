'use client';

import React, { ReactNode, useState, useEffect, TouchEvent } from 'react';
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
  const isMapPage = pathname === "/map";
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Touch gesture tracking state
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  
  // Swipe threshold (distance in pixels)
  const swipeThreshold = 50;

  // Effect for determining if the view is mobile
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAndUpdateMobileState = () => {
      const currentWidth = window.innerWidth;
      // console.log(`Path: ${pathname}, Width: ${currentWidth}, New isMobile: ${currentWidth < 768}`);
      setIsMobile(currentWidth < 768);
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

  // Effect to handle global swipe gestures on mobile
  useEffect(() => {
    if (!isMobile || isMapPage) return;

    const handleTouchStart = (e: TouchEvent | any) => {
      setTouchStartX(e.touches[0].clientX);
      setTouchEndX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent | any) => {
      setTouchEndX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchEndX - touchStartX;
      
      // Right swipe to open sidebar
      if (swipeDistance > swipeThreshold && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } 
      // Left swipe to close sidebar
      else if (swipeDistance < -swipeThreshold && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // Reset touch coordinates
      setTouchStartX(0);
      setTouchEndX(0);
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // Clean up event listeners
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isSidebarOpen, touchStartX, touchEndX, isMapPage]);

  return (
    <div className="flex h-screen">
      {/* Render AppSidebar for non-map pages based on screen size */}
      {!isMapPage && !isMobile && (
        <AppSidebar initialCollapsed={true} />
      )}
      
      {/* Mobile sidebar */}
      {!isMapPage && isMobile && (
        <>
          {/* Backdrop when sidebar is open */}
          <motion.div
            className="fixed inset-0 bg-black/20 z-30"
            initial={{ opacity: 1 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ pointerEvents: isSidebarOpen ? 'auto' : 'none' }}
          />
          
          {/* Mobile sidebar */}
          <motion.div
            className="fixed inset-y-0 left-0 z-40 shadow-lg"
            initial={{ x: 10 }}
            animate={{ x: isSidebarOpen ? 0 : "-100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 40 
            }}
            style={{ 
              width: '100px'
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