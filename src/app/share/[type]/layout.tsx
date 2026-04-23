import React from 'react';

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 간단한 헤더 (필요시 추가) */}
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">EasyDesk Publishing</span>
          </div>
        </header>

        <main>
          {children}
        </main>

        <footer className="mt-20 text-center text-slate-400 text-sm pb-12">
          <p>© {new Date().getFullYear()} EasyDesk. All rights reserved.</p>
          <p className="mt-1 font-medium italic opacity-75">Transforming raw data into actionable insights.</p>
        </footer>
      </div>
    </div>
  );
}
