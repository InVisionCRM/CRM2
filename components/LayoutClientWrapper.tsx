'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { motion, useDragControls, PanInfo } from "framer-motion";

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
  const dragControls = useDragControls();

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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity } = info;
    
    // Simple left/right swipe detection
    if (velocity.x < -100) {
      setIsSidebarOpen(false); // Close on left swipe
    } else if (velocity.x > 100) {
      setIsSidebarOpen(true);  // Open on right swipe
    }
  };

  return (
    <div className="flex h-screen">
      {/* Render AppSidebar for non-map pages based on screen size */}
      {!isMapPage && !isMobile && (
        <AppSidebar initialCollapsed={false} />
      )}
      
      {/* Mobile sidebar with swipe controls */}
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
            className="fixed inset-y-0 left-0 z-40 shadow-lg touch-pan-y"
            initial={{ x: 0 }}
            animate={{ x: isSidebarOpen ? 0 : "-100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 40 
            }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ 
              width: '300px',
              touchAction: "pan-y"
            }}
          >
            <AppSidebar initialCollapsed={false} />
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