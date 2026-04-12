'use client';

import React from 'react';
import { Sidebar } from '@/presentation/components/layout/Sidebar';
import { BottomNavigation } from '@/presentation/components/layout/BottomNavigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0 relative">
        {/* Subtle Background HUD Grid Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>
        
        <div className="relative z-10 flex-1 overflow-y-auto">
            {children}
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNavigation />
      </main>
    </div>
  );
}
