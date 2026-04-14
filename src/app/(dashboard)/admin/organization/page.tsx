import { getSessionAction } from "@/app/actions/auth";
import { getOrganizationDataAction } from "@/app/actions/organization";
import { OrganizationManager } from "@/components/OrganizationManager";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default async function OrganizationPage() {
    const session = await getSessionAction();
    if (!session || session.role !== 'ADMIN') {
        redirect('/');
    }

    const { departments, members } = await getOrganizationDataAction();

    return (
        <main className="max-w-[1600px] mx-auto p-8 md:p-12 space-y-12">
            <PageHeader 
                title="Organization"
                description="전사 조직도와 구성원 정보를 관리하고 엑셀을 통해 일괄 동기화합니다."
                icon={Users}
            />

            <OrganizationManager 
                initialDepartments={departments}
                initialMembers={members}
            />
        </main>
    );
}
