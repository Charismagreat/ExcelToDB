import { getPendingSteeringActionsAction } from "@/app/actions/workflow-steering";
import { SteeringHubClient } from "@/components/SteeringHubClient";
import { getSessionAction } from "@/app/actions/auth";
import { queryTable } from "@/egdesk-helpers";
import { redirect } from "next/navigation";

export default async function SteeringHubPage() {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        redirect('/');
    }

    const pendings = await getPendingSteeringActionsAction();
    const users = await queryTable('user', { filters: { isActive: '1' } });

    return (
        <main className="p-8 pb-32">
            <div className="max-w-7xl mx-auto space-y-10">
                <header className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">AI STEERING HUB</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">지능형 업무 지휘 센터</p>
                    <div className="h-1 w-20 bg-blue-600 rounded-full mt-2" />
                </header>

                <SteeringHubClient 
                    initialPendings={pendings} 
                    users={users}
                />
            </div>
        </main>
    );
}
