'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface MapLayoutProps {
  children: ReactNode;
}

export default function MapLayout({ children }: MapLayoutProps) {
  // The map layout explicitly doesn't include the AppSidebar
  return (
    <div className="flex h-screen">
      {/* Main content area - full width */}
      <div className="flex flex-col flex-1 w-full h-full">
        <main className="flex-1 w-full overflow-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
