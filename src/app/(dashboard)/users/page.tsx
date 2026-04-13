import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getUsersAction } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import { UserManagementTable } from '@/components/UserManagementTable';
import { Users, ShieldCheck, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function UsersPage() {
    const session = await getSessionAction();
    
    // Only ADMIN can access this page
    if (!session || session.role !== 'ADMIN') {
        redirect('/');
    }

    const users = await getUsersAction();

    return (
        <div className="p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                            <LayoutDashboard size={24} />
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Administration</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
                        <ShieldCheck size={18} className="text-indigo-500" />
                        <span>Administrator Control Panel</span>
                    </div>
                    <LogoutButton className="bg-white px-4 py-2 border rounded-full shadow-sm hover:bg-red-50" />
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <section>
                    <div className="mb-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Users size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">사용자 계정 관리</h1>
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mt-1">System User Registry & Control</p>
                            </div>
                        </div>
                    </div>

                    <UserManagementTable users={users as any} />
                </section>
            </main>

            <footer className="max-w-6xl mx-auto mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-gray-400">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">© 2026 Smart Data Management System - Admin Core</p>
                <Link href="/" className="text-xs font-black hover:text-blue-600 transition-colors border-b border-gray-200">BACK TO DASHBOARD</Link>
            </footer>
        </div>
    );
}
