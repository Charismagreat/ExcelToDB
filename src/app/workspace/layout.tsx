import React from 'react';
import BottomNav from '@/components/workspace/BottomNav';

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative w-full overflow-hidden mobile-shell">
            {/* Header (Optional, but usually needed for mobile shell) */}
            <header className="fixed top-0 w-full bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-100 z-40 h-14 flex items-center px-4">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    My Workspace
                </h1>
            </header>

            {/* Main Content Scroll Area */}
            <main className="flex-1 overflow-y-auto mt-14 pb-20 no-scrollbar">
                <div className="max-w-lg mx-auto w-full px-4 py-6">
                    {children}
                </div>
            </main>

            {/* Smart FAB Placeholder - will be added later in a specific container or layout layer */}
            
            <BottomNav />
        </div>
    );
}
