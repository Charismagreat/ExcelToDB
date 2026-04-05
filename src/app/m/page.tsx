'use client';

import React from 'react';
import MobileLayout from '@/components/mobile/MobileLayout';
import DynamicDashboard from '@/components/mobile/DynamicDashboard';
import TimelineFeed from '@/components/mobile/TimelineFeed';

export default function MobileDashboardPage() {
  // Mock user for UI demonstration
  const user = {
    id: 'user-001',
    name: '김혁신',
    role: 'ADMIN'
  };

  return (
    <MobileLayout user={user}>
      <div className="flex flex-col gap-6 animate-in fade-in duration-700">
        <DynamicDashboard user={user} />
        <TimelineFeed />
        
        {/* Extra Padding for Bottom Navigation */}
        <div className="h-6" />
      </div>
    </MobileLayout>
  );
}
