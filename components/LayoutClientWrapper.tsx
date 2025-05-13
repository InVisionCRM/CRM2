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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    const { offset, velocity } = info;

    // Log when the function is called and current state
    console.log(`[Swipe Debug] handleDragEnd triggered on path: ${pathname}`);
    console.log(`[Swipe Debug] Offset X: ${offset.x}, Velocity X: ${velocity.x}`);
    console.log(`[Swipe Debug] isSidebarOpen (before): ${isSidebarOpen}`);

    if (isSidebarOpen) {
      // Attempting to close
      if (offset.x < -50 || velocity.x < -300) {
        setIsSidebarOpen(false);
        console.log(`[Swipe Debug] Attempting to CLOSE sidebar. New isSidebarOpen: false`);
      } else {
        console.log(`[Swipe Debug] Drag did not meet threshold to CLOSE sidebar.`);
      }
    } else {
      // Attempting to open
      if (offset.x > 75 || velocity.x > 300) {
        setIsSidebarOpen(true);
        console.log(`[Swipe Debug] Attempting to OPEN sidebar. New isSidebarOpen: true`);
      } else {
        console.log(`[Swipe Debug] Drag did not meet threshold to OPEN sidebar.`);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Render AppSidebar for non-map pages based on screen size */}
      {!isMapPage && !isMobile && (
        <AppSidebar initialCollapsed={true} />
      )}
      
      {/* Mobile swipe gesture controls for non-map pages */}
      {!isMapPage && isMobile && (
        <>
          {/* Invisible drag area on edge of screen to open sidebar */}
          <motion.div 
            className="fixed left-0 top-0 w-12 h-full z-30 cursor-grab"
            drag="x"
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            aria-label="Open sidebar"
            // You can add a temporary visible background for debugging the drag area:
            // style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)' }} 
          />
          
          {/* Mobile sidebar with swipe controls */}
          <motion.div
            className="fixed inset-y-0 left-0 z-40 shadow-lg"
            initial={{ x: "-100%" }}
            animate={{ x: isSidebarOpen ? 0 : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ width: '300px' }}
            // You can add a temporary visible background for debugging the sidebar container:
            // style={{ width: '300px', backgroundColor: 'rgba(0, 255, 0, 0.2)' }}
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