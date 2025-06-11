'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { cn } from '@/lib/utils';
import { FixedWavyBackground } from '@/components/ui/fixed-wavy-background';

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

  return (
    <>
      <FixedWavyBackground />
      <div className="min-h-screen relative z-[1]">
        {/* Main content area */}
        <div 
          className={cn(
            "min-h-screen relative",
            // Add bottom padding for the navigation bar
            "pb-[calc(4rem+env(safe-area-inset-bottom))]"
          )}
        >
          <main>
            {children}
          </main>
        </div>
        
        {/* Render AppSidebar for all pages except map and auth pages */}
        {!isMapPage && !isAuthPage && <AppSidebar />}
      </div>
    </>
  );
} 