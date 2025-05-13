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

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setIsSidebarOpen(true); // Open sidebar if dragged right enough
    } else if (info.offset.x < -50) {
      setIsSidebarOpen(false); // Close sidebar if dragged left enough
    }
  };

  return (
    <div className="flex h-screen">
      {/* Render AppSidebar for non-map pages based on screen size */}
      {!isMapPage && !isMobile && (
        <AppSidebar />
      )}
      
      {/* Mobile swipe gesture controls for non-map pages */}
      {!isMapPage && isMobile && (
        <>
          {/* Invisible drag area on edge of screen to open sidebar */}
          <motion.div 
            className="fixed left-0 top-0 w-12 h-full z-30"
            drag="x"
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          />
          
          {/* Mobile sidebar with swipe controls */}
          <motion.div
            className="fixed inset-y-0 left-0 z-40"
            initial={{ x: "-100%" }}
            animate={{ x: isSidebarOpen ? 0 : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            <AppSidebar />
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