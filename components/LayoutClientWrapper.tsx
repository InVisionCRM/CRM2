'use client';

import React, { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';

interface LayoutClientWrapperProps {
  children: ReactNode;
}

/**
 * Client-side layout wrapper component that handles client-specific functionality
 * @param {LayoutClientWrapperProps} props - Component props
 * @returns {React.ReactElement} Rendered component
 */
export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps): React.ReactElement {
  const pathname = usePathname() || '';
  const isMapPage = pathname.startsWith("/map");
  const isAuthPage = pathname.startsWith("/auth");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-black">
      {/* Render AppSidebar for all pages except map and auth pages */}
      {!isMapPage && !isAuthPage && (
        <AppSidebar 
          initialCollapsed={true} 
          onCollapsedChange={setIsSidebarCollapsed}
        />
      )}
      
      {/* Main content area */}
      <div 
        className={`min-h-screen transition-[margin] duration-300 ${
          !isMapPage && !isAuthPage 
            ? isSidebarCollapsed 
              ? 'ml-[80px]' 
              : 'ml-[300px]'
            : ''
        }`}
      >
        <main>
          {children}
        </main>
      </div>
    </div>
  );
} 