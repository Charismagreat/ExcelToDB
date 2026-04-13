'use client';

import React, { useState, useEffect } from 'react';

interface DashboardLayoutClientProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ sidebar, children }: DashboardLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
    setIsMounted(true);
  }, []);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Add the isCollapsed state to the sidebar component
  // We use cloneElement to pass props to the sidebar node
  const sidebarWithProps = React.cloneElement(sidebar as React.ReactElement, {
    isCollapsed,
    onToggle: handleToggle
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {sidebarWithProps}
      <main 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isMounted ? (isCollapsed ? 'ml-20' : 'ml-72') : 'ml-72'
        }`}
      >
        <div className="flex-1 w-full overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
