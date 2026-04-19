import PageHeader from "@/components/PageHeader";
import { Zap } from "lucide-react";
import { getSessionAction } from "@/app/actions/auth";
import { getPendingSteeringActionsAction } from "@/app/actions/workflow-steering";
import { queryTable } from "@/egdesk-helpers";
import { redirect } from "next/navigation";
import { SteeringHubClient } from "@/components/SteeringHubClient";

export default async function SteeringHubPage() {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        redirect('/');
    }

    const pendings = await getPendingSteeringActionsAction();
    const users = await queryTable('user', { filters: { isActive: '1' } });

    return (
        <div className="px-8 md:px-12 pt-6 pb-12">
            <PageHeader 
                title="STEERING HUB"
                description="지능형 업무 지휘 센터: AI와 협업하여 복잡한 비즈니스 워크플로우를 실시간으로 제어하고 최적화합니다."
                icon={Zap}
            />

            <main className="max-w-[1600px] mx-auto mt-12 space-y-12">
                <SteeringHubClient 
                    initialPendings={pendings} 
                    users={users}
                />
            </main>
        </div>
    );
}
