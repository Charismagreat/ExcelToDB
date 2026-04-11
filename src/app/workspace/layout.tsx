import React from 'react';
import BottomNav from '@/components/workspace/BottomNav';
import SmartFAB from '@/components/workspace/SmartFAB';

import { getSessionAction } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSessionAction();
    if (!user) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative w-full overflow-hidden mobile-shell">
            {/* Header (Optional, but usually needed for mobile shell) */}
            <header className="fixed top-0 w-full bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-100 z-40 h-14 flex items-center justify-between px-6">
                <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Won Conductor
                </h1>
                <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase border-b-2 border-blue-600 pb-0.5">
                    My Workspace
                </span>
            </header>

            {/* Main Content Scroll Area */}
            <main className="flex-1 overflow-y-auto mt-14 pb-20 no-scrollbar">
                <div className="max-w-lg mx-auto w-full px-4 py-6">
                    {children}
                </div>
            </main>

            {/* Smart FAB */}
            <SmartFAB />
            
            <BottomNav />
        </div>
    );
}
