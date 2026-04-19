import React from 'react';
import { getSessionAction } from '@/app/actions/auth';
import { getUsersAction } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import { UserManagementTable } from '@/components/UserManagementTable';
import PageHeader from '@/components/PageHeader';
import { Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function UsersPage() {
    const session = await getSessionAction();
    
    // Only ADMIN can access this page
    if (!session || session.role !== 'ADMIN') {
        redirect('/');
    }

    const users = await getUsersAction();

    const headerRight = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white px-6 py-3 border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/5 text-sm font-bold text-slate-700">
                <ShieldCheck size={18} className="text-blue-500" />
                <span>Admin Console</span>
            </div>
            <LogoutButton className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all font-black text-xs uppercase tracking-widest" />
        </div>
    );

    return (
        <div className="px-8 md:px-12 pt-6 pb-12">
            <PageHeader 
                title="System Administration"
                description="조직의 사용자 계정을 관리하고 권한을 설정할 수 있는 관리자 패널입니다."
                icon={ShieldCheck}
                rightElement={headerRight}
            />

            <main className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <section>
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-900/5 overflow-hidden">
                        <div className="mb-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Users size={28} className="text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">사용자 계정 관리</h1>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry of all authorized system users</p>
                                </div>
                            </div>
                        </div>

                        <UserManagementTable users={users as any} />
                    </div>
                </section>
            </main>

            <footer className="max-w-[1600px] mx-auto mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">© 2026 Admin Core - Smart Data Management</p>
                <Link href="/dashboard" className="text-xs font-black hover:text-blue-600 transition-colors border-b border-slate-200 uppercase tracking-widest">Return to Dashboard</Link>
            </footer>
        </div>
    );
}
